import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { supabase } from "../lib/supabase";

const PROJECT_CACHE_KEY = "task-manager-project-cache-v1";
const DELETED_PROJECTS_KEY = "task-manager-project-trash-v1";
const PROJECT_CACHE_TTL_MS = 1000 * 60 * 5;
const DELETE_DELAY_MS = 1000 * 60 * 60 * 24 * 3;

const projectThemes = [
  {
    backgroundColor: "#1cb7ea",
    glowColorLarge: "rgba(46, 67, 255, 0.35)",
    glowColorSmall: "rgba(126, 40, 255, 0.45)",
    accentColor: "#ddf8ff",
  },
  {
    backgroundColor: "#f97316",
    glowColorLarge: "rgba(251, 146, 60, 0.38)",
    glowColorSmall: "rgba(190, 24, 93, 0.28)",
    accentColor: "#ffedd5",
  },
  {
    backgroundColor: "#10b981",
    glowColorLarge: "rgba(16, 185, 129, 0.35)",
    glowColorSmall: "rgba(14, 165, 233, 0.25)",
    accentColor: "#d1fae5",
  },
];

const ProjectContext = createContext(null);

function createTempId(prefix) {
  return `temp-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getTheme(indexSeed) {
  return projectThemes[indexSeed % projectThemes.length];
}

function normalizeProject(project, index = 0) {
  const numericId = Number(project.id);
  const theme = getTheme(Number.isNaN(numericId) ? index : numericId);

  return {
    id: String(project.id),
    title: project.title,
    createdAt: project.created_at,
    ...theme,
    tasks: (project.tasks || []).map((task) => ({
      id: String(task.id),
      title: task.task,
      completed: Boolean(task.is_completed),
      createdAt: task.created_at,
      projectId: String(project.id),
    })),
  };
}

function filterDeletedProjects(projectItems, deletedQueue = []) {
  if (deletedQueue.length === 0) {
    return projectItems;
  }

  const deletedIds = new Set(deletedQueue.map((project) => String(project.id)));
  return projectItems.filter((project) => !deletedIds.has(String(project.id)));
}

async function persistProjects(projectItems) {
  try {
    await AsyncStorage.setItem(
      PROJECT_CACHE_KEY,
      JSON.stringify({
        savedAt: Date.now(),
        projectItems,
      })
    );
  } catch (error) {
    console.warn("Failed to persist project cache", error);
  }
}

async function loadCachedProjects() {
  try {
    const rawCache = await AsyncStorage.getItem(PROJECT_CACHE_KEY);

    if (!rawCache) {
      return null;
    }

    const parsedCache = JSON.parse(rawCache);
    const isFresh =
      parsedCache?.savedAt &&
      Date.now() - parsedCache.savedAt < PROJECT_CACHE_TTL_MS &&
      Array.isArray(parsedCache.projectItems);

    return isFresh ? parsedCache.projectItems : null;
  } catch (error) {
    console.warn("Failed to read project cache", error);
    return null;
  }
}

async function persistDeletedProjects(deletedProjects) {
  try {
    await AsyncStorage.setItem(
      DELETED_PROJECTS_KEY,
      JSON.stringify(deletedProjects)
    );
  } catch (error) {
    console.warn("Failed to persist deleted projects", error);
  }
}

async function loadDeletedProjects() {
  try {
    const rawDeletedProjects = await AsyncStorage.getItem(DELETED_PROJECTS_KEY);

    if (!rawDeletedProjects) {
      return [];
    }

    const parsedDeletedProjects = JSON.parse(rawDeletedProjects);
    return Array.isArray(parsedDeletedProjects) ? parsedDeletedProjects : [];
  } catch (error) {
    console.warn("Failed to read deleted projects", error);
    return [];
  }
}

export function ProjectProvider({ children }) {
  const [projectItems, setProjectItems] = useState([]);
  const [deletedProjects, setDeletedProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncError, setSyncError] = useState(null);
  const projectItemsRef = useRef([]);
  const deletedProjectsRef = useRef([]);

  const updateProjectItems = (updater) => {
    const nextProjectItems =
      typeof updater === "function"
        ? updater(projectItemsRef.current)
        : updater;

    projectItemsRef.current = nextProjectItems;
    setProjectItems(nextProjectItems);
    void persistProjects(nextProjectItems);

    return nextProjectItems;
  };

  const replaceProject = (projectId, nextProject) => {
    updateProjectItems((currentProjectItems) =>
      currentProjectItems.map((project) =>
        project.id === projectId ? nextProject : project
      )
    );
  };

  const restoreDeletedProject = (projectId, projectSnapshot) => {
    updateDeletedProjects((currentDeletedProjects) =>
      currentDeletedProjects.filter((project) => project.id !== projectId)
    );
    updateProjectItems((currentProjectItems) => [projectSnapshot, ...currentProjectItems]);
  };

  const updateDeletedProjects = (updater) => {
    const nextDeletedProjects =
      typeof updater === "function"
        ? updater(deletedProjectsRef.current)
        : updater;

    deletedProjectsRef.current = nextDeletedProjects;
    setDeletedProjects(nextDeletedProjects);
    void persistDeletedProjects(nextDeletedProjects);

    return nextDeletedProjects;
  };

  const processPendingDeletes = async (pendingProjects = deletedProjectsRef.current) => {
    const now = Date.now();
    const dueProjects = pendingProjects.filter(
      (project) => new Date(project.deleteAfter).getTime() <= now
    );

    if (dueProjects.length === 0) {
      return;
    }

    const persistedProjectIds = dueProjects
      .map((project) => Number(project.id))
      .filter((projectId) => !Number.isNaN(projectId));

    if (persistedProjectIds.length > 0) {
      const { error } = await supabase
        .from("projects")
        .delete()
        .in("id", persistedProjectIds);

      if (error) {
        console.warn("Failed to delete queued projects", error);
        throw error;
      }
    }

    updateDeletedProjects((currentDeletedProjects) =>
      currentDeletedProjects.filter(
        (project) =>
          !dueProjects.some((dueProject) => dueProject.id === project.id)
      )
    );
  };

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from("projects")
      .select("id,title,created_at,tasks(id,task,is_completed,created_at)")
      .order("created_at", { ascending: false })
      .order("created_at", {
        ascending: true,
        referencedTable: "tasks",
      });

    if (error) {
      throw error;
    }

    return (data || []).map((project, index) => normalizeProject(project, index));
  };

  useEffect(() => {
    let isActive = true;

    const hydrateProjects = async () => {
      const cachedProjects = await loadCachedProjects();
      const queuedDeletedProjects = await loadDeletedProjects();

      if (isActive) {
        updateDeletedProjects(queuedDeletedProjects);
      }

      if (isActive && cachedProjects) {
        updateProjectItems(filterDeletedProjects(cachedProjects, queuedDeletedProjects));
      }

      try {
        await processPendingDeletes(queuedDeletedProjects);
      } catch (error) {
        if (isActive) {
          setSyncError(error);
        }
      }

      try {
        const remoteProjects = await fetchProjects();

        if (!isActive) {
          return;
        }

        updateProjectItems(
          filterDeletedProjects(remoteProjects, deletedProjectsRef.current)
        );
        setSyncError(null);
      } catch (error) {
        if (isActive) {
          setSyncError(error);
          console.warn("Failed to fetch projects", error);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void hydrateProjects();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    const deleteTimer = setInterval(() => {
      void processPendingDeletes();
    }, 1000 * 60 * 30);

    return () => {
      clearInterval(deleteTimer);
    };
  }, []);

  const addProject = async ({ title, tasks }) => {
    const tempProjectId = createTempId("project");
    const optimisticProject = {
      id: tempProjectId,
      title,
      createdAt: new Date().toISOString(),
      ...getTheme(projectItemsRef.current.length),
      tasks: tasks.map((taskTitle) => ({
        id: createTempId("task"),
        title: taskTitle,
        completed: false,
        createdAt: new Date().toISOString(),
        projectId: tempProjectId,
      })),
    };

    updateProjectItems((currentProjectItems) => [
      optimisticProject,
      ...currentProjectItems,
    ]);

    try {
      const { data: insertedProjects, error: projectError } = await supabase
        .from("projects")
        .insert({ title })
        .select("id,title,created_at");

      if (projectError) {
        throw projectError;
      }

      const insertedProject = insertedProjects?.[0];

      if (!insertedProject) {
        throw new Error("Project insert returned no data.");
      }

      const latestOptimisticProject = projectItemsRef.current.find(
        (project) => project.id === tempProjectId
      );
      const taskPayload = (latestOptimisticProject?.tasks || optimisticProject.tasks).map(
        (task) => ({
          project_id: insertedProject.id,
          task: task.title,
          is_completed: Boolean(task.completed),
        })
      );

      let insertedTasks = [];

      if (taskPayload.length > 0) {
        const { data: createdTasks, error: taskError } = await supabase
          .from("tasks")
          .insert(taskPayload)
          .select("id,task,is_completed,created_at,project_id");

        if (taskError) {
          await supabase.from("projects").delete().eq("id", insertedProject.id);
          throw taskError;
        }

        insertedTasks = createdTasks || [];
      }

      const confirmedProject = normalizeProject(
        {
          ...insertedProject,
          tasks: insertedTasks,
        },
        0
      );

      replaceProject(tempProjectId, confirmedProject);
      setSyncError(null);

      return confirmedProject;
    } catch (error) {
      updateProjectItems((currentProjectItems) =>
        currentProjectItems.filter((project) => project.id !== tempProjectId)
      );
      setSyncError(error);
      console.warn("Failed to create project", error);
      throw error;
    }
  };

  const toggleProjectTask = async (projectId, taskId) => {
    const currentProject = projectItemsRef.current.find(
      (project) => project.id === projectId
    );
    const currentTask = currentProject?.tasks.find((task) => task.id === taskId);

    if (!currentTask) {
      return;
    }

    const nextCompletedState = !currentTask.completed;
    const nextProjectSnapshot = {
      ...currentProject,
      tasks: currentProject.tasks.map((task) =>
        task.id === taskId
          ? { ...task, completed: nextCompletedState }
          : task
      ),
    };
    const shouldArchiveProject =
      nextProjectSnapshot.tasks.length > 0 &&
      nextProjectSnapshot.tasks.every((task) => task.completed);

    updateProjectItems((currentProjectItems) =>
      currentProjectItems.map((project) =>
        project.id === projectId
          ? {
              ...project,
              tasks: project.tasks.map((task) =>
                task.id === taskId
                  ? { ...task, completed: nextCompletedState }
                  : task
              ),
            }
          : project
      )
    );

    if (shouldArchiveProject) {
      queueCompletedProject(nextProjectSnapshot);
    }

    if (String(taskId).startsWith("temp-")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          is_completed: nextCompletedState,
        })
        .eq("id", taskId);

      if (error) {
        throw error;
      }

      setSyncError(null);
    } catch (error) {
      if (shouldArchiveProject) {
        restoreDeletedProject(projectId, currentProject);
      } else {
        updateProjectItems((currentProjectItems) =>
          currentProjectItems.map((project) =>
            project.id === projectId
              ? {
                  ...project,
                  tasks: project.tasks.map((task) =>
                    task.id === taskId
                      ? { ...task, completed: currentTask.completed }
                      : task
                  ),
                }
              : project
          )
        );
      }
      setSyncError(error);
      console.warn("Failed to update task", error);
    }
  };

  const deleteProject = async (projectId) => {
    const projectToDelete = projectItemsRef.current.find(
      (project) => project.id === projectId
    );

    if (!projectToDelete) {
      return;
    }

    const deletedAt = new Date().toISOString();
    const deleteAfter = new Date(Date.now() + DELETE_DELAY_MS).toISOString();

    updateProjectItems((currentProjectItems) =>
      currentProjectItems.filter((project) => project.id !== projectId)
    );
    updateDeletedProjects((currentDeletedProjects) => [
      {
        ...projectToDelete,
        deletedAt,
        deleteAfter,
      },
      ...currentDeletedProjects.filter((project) => project.id !== projectId),
    ]);
    setSyncError(null);
  };

  const queueCompletedProject = (projectSnapshot) => {
    const deletedAt = new Date().toISOString();
    const deleteAfter = new Date(Date.now() + DELETE_DELAY_MS).toISOString();

    updateProjectItems((currentProjectItems) =>
      currentProjectItems.filter((project) => project.id !== projectSnapshot.id)
    );
    updateDeletedProjects((currentDeletedProjects) => [
      {
        ...projectSnapshot,
        deletedAt,
        deleteAfter,
      },
      ...currentDeletedProjects.filter(
        (project) => project.id !== projectSnapshot.id
      ),
    ]);
  };

  const value = useMemo(
    () => ({
      deletedProjects,
      projectItems,
      isLoading,
      syncError,
      addProject,
      deleteProject,
      processPendingDeletes,
      refreshProjects: async () => {
        await processPendingDeletes();
        const remoteProjects = await fetchProjects();
        updateProjectItems(
          filterDeletedProjects(remoteProjects, deletedProjectsRef.current)
        );
        setSyncError(null);
      },
      toggleProjectTask,
    }),
    [deletedProjects, isLoading, projectItems, syncError]
  );

  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  );
}

export function useProjects() {
  const value = useContext(ProjectContext);

  if (!value) {
    throw new Error("useProjects must be used within a ProjectProvider");
  }

  return value;
}
