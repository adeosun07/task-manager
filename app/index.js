import React, { useEffect, useState } from "react";
import {
  Alert,
  LayoutAnimation,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
  Image,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";
import ProjectCard from "../components/ProjectCard";
import { useProjects } from "../contexts/projectContext";
import { Ionicons } from "@expo/vector-icons"

export default function index() {
  const { deletedProjects, deleteProject, projectItems, toggleProjectTask } =
    useProjects();
  const [expandedProjectId, setExpandedProjectId] = useState(null);
  const [menuProjectId, setMenuProjectId] = useState(null);
  const [isTrashOpen, setIsTrashOpen] = useState(false);

  useEffect(() => {
    if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const toggleProjectExpand = (projectId) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMenuProjectId(null);
    setExpandedProjectId((currentId) =>
      currentId === projectId ? null : projectId
    );
  };

  const toggleProjectMenu = (projectId) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMenuProjectId((currentId) => (currentId === projectId ? null : projectId));
  };

  const handleDeleteProject = async (projectId) => {
    const project = projectItems.find((item) => item.id === projectId);

    Alert.alert(
      "Delete project?",
      project
        ? `"${project.title.replace(/\n/g, " ")}" will move to the recycle bin for 3 days.`
        : "This project will move to the recycle bin for 3 days.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setMenuProjectId(null);
            setExpandedProjectId((currentId) =>
              currentId === projectId ? null : currentId
            );
            await deleteProject(projectId);
          },
        },
      ]
    );
  };

  const handleToggleTask = (project, taskId) => {
    const task = project.tasks.find((item) => item.id === taskId);

    if (!task) {
      return;
    }

    const willCompleteProject =
      !task.completed &&
      project.tasks.length > 0 &&
      project.tasks.every((item) => item.id === taskId || item.completed);

    if (!willCompleteProject) {
      void toggleProjectTask(project.id, taskId);
      return;
    }

    Alert.alert(
      "Complete project?",
      `"${project.title.replace(/\n/g, " ")}" will be moved to the recycle bin when all tasks are completed.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Complete",
          onPress: () => {
            void toggleProjectTask(project.id, taskId);
          },
        },
      ]
    );
  };

  const formatDeleteDeadline = (deleteAfter) => {
    const diffMs = new Date(deleteAfter).getTime() - Date.now();
    const diffDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    if (diffDays <= 1) {
      return "removes in less than a day";
    }

    return `removes in ${diffDays} days`;
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.container}>
        {isTrashOpen ? (
          <Pressable
            onPress={() => setIsTrashOpen(false)}
            style={styles.overlayBackdrop}
          />
        ) : null}

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerRow}>
            <View style={styles.headerTextGroup}>
              <Text style={styles.greeting}>Hello, Adeosun</Text>
              <Text style={styles.title}>
                {`Your Projects (${projectItems.length})`}
              </Text>
            </View>
            <View style={styles.headerActions}>
              <Pressable
                accessibilityLabel="Open deleted projects"
                onPress={() => setIsTrashOpen((currentValue) => !currentValue)}
                style={styles.trashButton}
              >
                <Ionicons name="trash-outline" style={styles.trashButtonIcon} />
                {deletedProjects.length > 0 ? (
                  <View style={styles.trashBadge}>
                    <Text style={styles.trashBadgeText}>{deletedProjects.length}</Text>
                  </View>
                ) : null}
              </Pressable>
              <View style={styles.profileWrapper}>
                <Image
                  source={require("../assets/favicon.png")}
                  style={styles.profileImage}
                />
              </View>
            </View>
          </View>

          {projectItems.map((project) => (
            <ProjectCard
              key={project.id}
              id={project.id}
              title={project.title}
              tasks={project.tasks}
              backgroundColor={project.backgroundColor}
              glowColorLarge={project.glowColorLarge}
              glowColorSmall={project.glowColorSmall}
              accentColor={project.accentColor}
              isExpanded={expandedProjectId === project.id}
              showMenu={menuProjectId === project.id}
              onDelete={handleDeleteProject}
              onToggleExpand={() => toggleProjectExpand(project.id)}
              onMorePress={() => toggleProjectMenu(project.id)}
              onToggleTask={(taskId) => handleToggleTask(project, taskId)}
            />
          ))}
        </ScrollView>

        {isTrashOpen ? (
          <Animated.View
            entering={FadeInDown.duration(220)}
            exiting={FadeOutUp.duration(180)}
            style={styles.trashPanel}
          >
            <Text style={styles.trashPanelTitle}>Recently deleted</Text>
            {deletedProjects.length === 0 ? (
              <Text style={styles.trashPanelEmpty}>
                Deleted projects will wait here for 3 days before final removal.
              </Text>
            ) : (
              deletedProjects.map((project) => (
                <View key={project.id} style={styles.trashRow}>
                  <View style={styles.trashRowTextBlock}>
                    <Text numberOfLines={1} style={styles.trashRowTitle}>
                      {project.title}
                    </Text>
                    <Text style={styles.trashRowMeta}>
                      {formatDeleteDeadline(project.deleteAfter)}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </Animated.View>
        ) : null}

        <Pressable
          accessibilityLabel="Create task"
          onPress={() => router.push("/createTask")}
          style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        >
          <Text style={styles.fabIcon}>+</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f4f1ea",
  },
  container: {
    flex: 1,
    position: "relative",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 140,
    gap: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    zIndex: 2,
  },
  headerTextGroup: {
    flex: 1,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  greeting: {
    fontSize: 15,
    color: "#6b7280",
    marginBottom: 6,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1f2937",
    lineHeight: 38,
  },
  trashButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e7e5e4",
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  trashButtonIcon: {
    fontSize: 18,
    color: "#44403c",
    fontWeight: "700",
  },
  trashBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: "#dc2626",
    alignItems: "center",
    justifyContent: "center",
  },
  trashBadgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "700",
  },
  profileWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#e5e7eb",
    borderWidth: 2,
    borderColor: "#ffffff",
    shadowColor: "#000000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  profileImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  overlayBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.08)",
    zIndex: 1,
  },
  trashPanel: {
    position: "absolute",
    top: 92,
    right: 20,
    width: 280,
    borderRadius: 24,
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.98)",
    borderWidth: 1,
    borderColor: "#e7e5e4",
    shadowColor: "#000000",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
    zIndex: 3,
  },
  trashPanelTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 12,
  },
  trashPanelEmpty: {
    fontSize: 13,
    lineHeight: 19,
    color: "#78716c",
  },
  trashRow: {
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#ece7e1",
  },
  trashRowTextBlock: {
    gap: 4,
  },
  trashRowTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#292524",
  },
  trashRowMeta: {
    fontSize: 12,
    color: "#78716c",
  },
  fab: {
    position: "absolute",
    bottom: 28,
    alignSelf: "center",
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  fabPressed: {
    transform: [{ scale: 0.96 }],
  },
  fabIcon: {
    fontSize: 36,
    lineHeight: 38,
    color: "#ffffff",
    fontWeight: "300",
    marginTop: -2,
  },
});
