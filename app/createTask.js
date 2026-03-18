import React, { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useProjects } from "../contexts/projectContext";

export default function createTask() {
  const { addProject } = useProjects();
  const [projectName, setProjectName] = useState("");
  const [taskName, setTaskName] = useState("");
  const [projectTasks, setProjectTasks] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const translateY = useSharedValue(0);

  const trimmedProjectName = projectName.trim();
  const trimmedTaskName = taskName.trim();
  const canSubmit = trimmedProjectName.length > 0 && projectTasks.length > 0;

  const taskPlaceholder = useMemo(() => {
    if (projectTasks.length === 0) {
      return "Add the first task";
    }

    return "Add another task";
  }, [projectTasks.length]);

  const closeSheet = () => {
    router.back();
  };

  const addTaskToProject = () => {
    if (!trimmedTaskName) {
      return;
    }

    setProjectTasks((currentTasks) => [...currentTasks, trimmedTaskName]);
    setTaskName("");
    setErrorMessage("");
  };

  const removeTaskFromProject = (taskIndex) => {
    setProjectTasks((currentTasks) =>
      currentTasks.filter((_, index) => index !== taskIndex)
    );
  };

  const handleCreateProject = async () => {
    const nextTasks = trimmedTaskName
      ? [...projectTasks, trimmedTaskName]
      : projectTasks;

    if (!trimmedProjectName) {
      setErrorMessage("Project name is required.");
      return;
    }

    if (nextTasks.length === 0) {
      setErrorMessage("Add at least one task before creating the project.");
      return;
    }

    try {
      setIsSaving(true);
      await addProject({
        title: trimmedProjectName,
        tasks: nextTasks,
      });
      setProjectName("");
      setTaskName("");
      setProjectTasks([]);
      setErrorMessage("");
      translateY.value = withTiming(600, { duration: 180 }, () => {
        runOnJS(closeSheet)();
      });
    } catch (error) {
      setErrorMessage("Couldn't create the project right now. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const pan = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      if (event.translationY > 120 || event.velocityY > 900) {
        translateY.value = withTiming(600, { duration: 180 }, () => {
          runOnJS(closeSheet)();
        });
      } else {
        translateY.value = withSpring(0, {
          damping: 18,
          stiffness: 180,
        });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.backdrop}>
        <Animated.View style={[styles.sheet, animatedStyle]}>
          <GestureDetector gesture={pan}>
            <View style={styles.handleTouchArea}>
              <View style={styles.handle} />
            </View>
          </GestureDetector>

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.keyboardView}
          >
            <ScrollView
              bounces={false}
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.topBar}>
                <Text style={styles.heading}>Create Project</Text>
                <Pressable
                  onPress={() => {
                    translateY.value = withTiming(600, { duration: 180 }, () => {
                      runOnJS(closeSheet)();
                    });
                  }}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeText}>x</Text>
                </Pressable>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>PROJECT NAME</Text>
                <TextInput
                  onChangeText={setProjectName}
                  placeholder="Website redesign"
                  placeholderTextColor="#a8a29e"
                  style={styles.input}
                  value={projectName}
                />
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>TASKS</Text>
                <View style={styles.taskInputRow}>
                  <Pressable
                    accessibilityLabel="Add task"
                    disabled={isSaving}
                    onPress={addTaskToProject}
                    style={styles.addTaskButton}
                  >
                    <Text style={styles.addTaskButtonText}>+</Text>
                  </Pressable>
                  <TextInput
                    onChangeText={setTaskName}
                    onSubmitEditing={addTaskToProject}
                    placeholder={taskPlaceholder}
                    placeholderTextColor="#a8a29e"
                    returnKeyType="done"
                    style={styles.taskInput}
                    editable={!isSaving}
                    value={taskName}
                  />
                </View>

                <View style={styles.taskList}>
                  {projectTasks.map((task, index) => (
                    <View key={`${task}-${index}`} style={styles.taskPill}>
                      <Text style={styles.taskPillText}>{task}</Text>
                      <Pressable
                        accessibilityLabel={`Remove ${task}`}
                        hitSlop={8}
                        onPress={() => removeTaskFromProject(index)}
                      >
                        <Text style={styles.taskPillRemove}>x</Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              </View>

              {errorMessage ? (
                <Text style={styles.errorText}>{errorMessage}</Text>
              ) : null}

              <Pressable
                onPress={handleCreateProject}
                style={[
                  styles.createButton,
                  !canSubmit && !trimmedTaskName && styles.createButtonDisabled,
                  isSaving && styles.createButtonDisabled,
                ]}
              >
                <Text style={styles.createButtonText}>
                  {isSaving ? "Creating..." : "Create"}
                </Text>
              </Pressable>
            </ScrollView>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.18)",
  },
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    minHeight: "80%",
    maxHeight: "90%",
    backgroundColor: "#fcfbf7",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: "#000000",
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 16,
  },
  handleTouchArea: {
    paddingTop: 12,
    paddingBottom: 10,
  },
  handle: {
    width: 48,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#d6d3d1",
    alignSelf: "center",
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  heading: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  section: {
    marginBottom: 22,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    color: "#a8a29e",
    marginBottom: 12,
  },
  input: {
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#d6d3d1",
    backgroundColor: "#ffffff",
    paddingHorizontal: 18,
    fontSize: 15,
    color: "#1c1917",
  },
  taskInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  addTaskButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
  },
  addTaskButtonText: {
    color: "#ffffff",
    fontSize: 28,
    lineHeight: 30,
    fontWeight: "300",
  },
  taskInput: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#d6d3d1",
    backgroundColor: "#ffffff",
    paddingHorizontal: 18,
    fontSize: 15,
    color: "#1c1917",
  },
  taskList: {
    gap: 10,
    marginTop: 14,
  },
  taskPill: {
    minHeight: 48,
    borderRadius: 24,
    paddingLeft: 18,
    paddingRight: 14,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e7e5e4",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  taskPillText: {
    flex: 1,
    fontSize: 15,
    color: "#292524",
  },
  taskPillRemove: {
    fontSize: 16,
    fontWeight: "700",
    color: "#78716c",
  },
  errorText: {
    marginTop: -4,
    marginBottom: 10,
    color: "#dc2626",
    fontSize: 13,
    fontWeight: "500",
  },
  createButton: {
    height: 58,
    borderRadius: 29,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  createButtonDisabled: {
    opacity: 0.65,
  },
  createButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});
