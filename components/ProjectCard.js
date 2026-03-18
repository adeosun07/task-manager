import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOutLeft,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";

function TaskRow({ task, onToggle }) {
  return (
    <Pressable onPress={onToggle} style={styles.taskRow}>
      <View
        style={[
          styles.taskCheck,
          task.completed && styles.taskCheckCompleted,
        ]}
      >
        {task.completed ? <Text style={styles.taskCheckMark}>v</Text> : null}
      </View>
      <Text
        style={[styles.taskText, task.completed && styles.taskTextCompleted]}
      >
        {task.title}
      </Text>
    </Pressable>
  );
}

export default function ProjectCard({
  id,
  title,
  tasks,
  backgroundColor = "#1cb7ea",
  glowColorLarge = "rgba(46, 67, 255, 0.35)",
  glowColorSmall = "rgba(126, 40, 255, 0.45)",
  accentColor = "#ddf8ff",
  isExpanded = false,
  showMenu = false,
  onDelete,
  onToggleExpand,
  onMorePress,
  onToggleTask,
}) {
  const completedTasks = tasks.filter((task) => task.completed).length;
  const totalTasks = tasks.length;
  const progress = totalTasks > 0 ? completedTasks / totalTasks : 0;
  const progressHeight = `${Math.max(progress * 100, 8)}%`;
  const activeTasks = tasks.filter((task) => !task.completed);
  const finishedTasks = tasks.filter((task) => task.completed);

  if (isExpanded) {
    return (
      <Animated.View
        exiting={FadeOutLeft.duration(220)}
        layout={LinearTransition.springify()}
        style={styles.expandedShell}
      >
        <View style={[styles.hero, { backgroundColor }]}>
          <View style={[styles.glowLarge, { backgroundColor: glowColorLarge }]} />
          <View style={[styles.glowSmall, { backgroundColor: glowColorSmall }]} />

          <View style={styles.expandedTopRow}>
            <Pressable onPress={onToggleExpand} style={styles.topIconButton}>
              <Text style={styles.topIconText}>{"<"}</Text>
            </Pressable>
            <Pressable onPress={onMorePress} style={styles.topIconButton}>
              <Text style={styles.topIconText}>...</Text>
            </Pressable>
          </View>

          {showMenu ? (
            <Animated.View
              entering={FadeIn.duration(180)}
              exiting={FadeOut.duration(150)}
              style={styles.menuCard}
            >
              <Pressable onPress={() => onDelete(id)} style={styles.menuAction}>
                <Text style={styles.menuActionText}>Delete</Text>
              </Pressable>
            </Animated.View>
          ) : null}

          <View style={styles.heroContent}>
            <Text style={styles.title}>{title}</Text>

            <View style={styles.progressColumn}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { height: progressHeight }]} />
              </View>

              <View>
                <Text style={styles.countText}>
                  {completedTasks}/{totalTasks}
                </Text>
                <Text style={styles.labelText}>tasks</Text>
              </View>
            </View>
          </View>

          <Pressable
            accessibilityLabel={`Collapse ${title}`}
            onPress={onToggleExpand}
            style={[styles.centerAddButton, { backgroundColor: accentColor }]}
          >
            <Text style={styles.centerAddButtonText}>+</Text>
          </Pressable>
        </View>

        <View style={styles.detailsPanel}>
          <View style={styles.tasksBlock}>
            {activeTasks.map((task, index) => (
              <Animated.View
                entering={FadeInDown.delay(index * 45).duration(220)}
                key={task.id}
              >
                <TaskRow
                  task={task}
                  onToggle={() => onToggleTask(task.id)}
                />
              </Animated.View>
            ))}
          </View>

          <View style={styles.completedHeader}>
            <Text style={styles.completedLabel}>
              COMPLETED ({finishedTasks.length})
            </Text>
            <Text style={styles.completedChevron}>v</Text>
          </View>

          <View style={styles.tasksBlock}>
            {finishedTasks.map((task, index) => (
              <Animated.View
                entering={FadeInDown.delay(index * 45).duration(220)}
                key={task.id}
              >
                <TaskRow
                  task={task}
                  onToggle={() => onToggleTask(task.id)}
                />
              </Animated.View>
            ))}
          </View>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      exiting={FadeOutLeft.duration(220)}
      layout={LinearTransition.springify()}
      style={[styles.card, { backgroundColor }]}
    >
      <View style={[styles.glowLarge, { backgroundColor: glowColorLarge }]} />
      <View style={[styles.glowSmall, { backgroundColor: glowColorSmall }]} />

      <View style={styles.topRow}>
        <Text style={styles.title}>{title}</Text>
        <Pressable onPress={onMorePress} style={styles.mutedButton}>
          <Text style={styles.mutedButtonText}>...</Text>
        </Pressable>
      </View>

      {showMenu ? (
        <Animated.View
          entering={FadeIn.duration(180)}
          exiting={FadeOut.duration(150)}
          style={styles.menuCard}
        >
          <Pressable onPress={() => onDelete(id)} style={styles.menuAction}>
            <Text style={styles.menuActionText}>Delete</Text>
          </Pressable>
        </Animated.View>
      ) : null}

      <View style={styles.metaRow}>
        <View style={styles.progressColumn}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { height: progressHeight }]} />
          </View>

          <View>
            <Text style={styles.countText}>
              {completedTasks}/{totalTasks}
            </Text>
            <Text style={styles.labelText}>tasks</Text>
          </View>
        </View>
      </View>

      <View style={styles.bottomRow}>
        <Pressable
          accessibilityLabel={`Open ${title}`}
          onPress={onToggleExpand}
          style={[styles.addButton, { backgroundColor: accentColor }]}
        >
          <Text style={styles.addButtonText}>+</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 260,
    borderRadius: 34,
    padding: 16,
    overflow: "hidden",
    position: "relative",
    shadowColor: "#000000",
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  expandedShell: {
    borderRadius: 34,
    overflow: "hidden",
    backgroundColor: "#ffffff",
    position: "relative",
    shadowColor: "#000000",
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  hero: {
    minHeight: 300,
    padding: 16,
    overflow: "hidden",
    position: "relative",
  },
  glowLarge: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    top: 34,
    left: 38,
  },
  glowSmall: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
    top: 82,
    left: 106,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    zIndex: 1,
  },
  expandedTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 1,
  },
  topIconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.88)",
    alignItems: "center",
    justifyContent: "center",
  },
  topIconText: {
    color: "#2d3748",
    fontSize: 18,
  },
  menuCard: {
    position: "absolute",
    top: 62,
    right: 16,
    minWidth: 116,
    borderRadius: 18,
    backgroundColor: "rgba(28, 25, 23, 0.94)",
    padding: 6,
    zIndex: 3,
    shadowColor: "#000000",
    shadowOpacity: 0.16,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  menuAction: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  menuActionText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  heroContent: {
    flex: 1,
    justifyContent: "center",
    zIndex: 1,
  },
  title: {
    flex: 1,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: -0.8,
  },
  metaRow: {
    flex: 1,
    justifyContent: "center",
    zIndex: 1,
  },
  progressColumn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: 16,
  },
  progressTrack: {
    width: 14,
    height: 86,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.35)",
    justifyContent: "flex-end",
    padding: 2,
  },
  progressFill: {
    borderRadius: 999,
    backgroundColor: "#ffffff",
  },
  countText: {
    fontSize: 34,
    fontWeight: "800",
    color: "#ffffff",
    lineHeight: 36,
  },
  labelText: {
    fontSize: 18,
    color: "rgba(255,255,255,0.92)",
    marginTop: 2,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    zIndex: 1,
  },
  mutedButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  mutedButtonText: {
    color: "#ffffff",
    fontSize: 20,
    letterSpacing: 1,
  },
  outlinedButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.75)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  outlinedButtonText: {
    color: "#ffffff",
    fontSize: 18,
    letterSpacing: 1.5,
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: {
    color: "#1f2937",
    fontSize: 30,
    lineHeight: 32,
    fontWeight: "300",
  },
  centerAddButton: {
    position: "absolute",
    bottom: -28,
    alignSelf: "center",
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  centerAddButtonText: {
    color: "#1f2937",
    fontSize: 30,
    lineHeight: 32,
    fontWeight: "300",
  },
  detailsPanel: {
    backgroundColor: "#ffffff",
    paddingTop: 42,
    paddingBottom: 16,
  },
  tasksBlock: {
    paddingHorizontal: 20,
  },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ece7e1",
  },
  taskCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#d4d4d8",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  taskCheckCompleted: {
    borderColor: "#e7e5e4",
    backgroundColor: "#f5f5f4",
  },
  taskCheckMark: {
    color: "#44403c",
    fontSize: 14,
    fontWeight: "700",
  },
  taskText: {
    flex: 1,
    fontSize: 15,
    color: "#292524",
  },
  taskTextCompleted: {
    color: "#78716c",
    textDecorationLine: "line-through",
  },
  completedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 6,
  },
  completedLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: "#a8a29e",
  },
  completedChevron: {
    fontSize: 14,
    color: "#a8a29e",
  },
});
