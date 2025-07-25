import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all todos grouped by status
export const getTodos = query({
  args: {},
  returns: v.object({
    todo: v.array(
      v.object({
        _id: v.id("todos"),
        _creationTime: v.number(),
        title: v.string(),
        description: v.optional(v.string()),
        status: v.union(
          v.literal("todo"),
          v.literal("in-progress"),
          v.literal("done"),
        ),
        priority: v.union(
          v.literal("low"),
          v.literal("medium"),
          v.literal("high"),
        ),
        dueDate: v.optional(v.string()),
        createdAt: v.number(),
        updatedAt: v.number(),
      }),
    ),
    in_progress: v.array(
      v.object({
        _id: v.id("todos"),
        _creationTime: v.number(),
        title: v.string(),
        description: v.optional(v.string()),
        status: v.union(
          v.literal("todo"),
          v.literal("in-progress"),
          v.literal("done"),
        ),
        priority: v.union(
          v.literal("low"),
          v.literal("medium"),
          v.literal("high"),
        ),
        dueDate: v.optional(v.string()),
        createdAt: v.number(),
        updatedAt: v.number(),
      }),
    ),
    done: v.array(
      v.object({
        _id: v.id("todos"),
        _creationTime: v.number(),
        title: v.string(),
        description: v.optional(v.string()),
        status: v.union(
          v.literal("todo"),
          v.literal("in-progress"),
          v.literal("done"),
        ),
        priority: v.union(
          v.literal("low"),
          v.literal("medium"),
          v.literal("high"),
        ),
        dueDate: v.optional(v.string()),
        createdAt: v.number(),
        updatedAt: v.number(),
      }),
    ),
  }),
  handler: async (ctx) => {
    const allTodos = await ctx.db
      .query("todos")
      .withIndex("by_created_at")
      .order("desc")
      .collect();

    const todosByStatus = {
      todo: allTodos.filter((todo) => todo.status === "todo"),
      in_progress: allTodos.filter((todo) => todo.status === "in-progress"),
      done: allTodos.filter((todo) => todo.status === "done"),
    };

    return todosByStatus;
  },
});

// Create a new todo
export const createTodo = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    dueDate: v.optional(v.string()),
  },
  returns: v.id("todos"),
  handler: async (ctx, args) => {
    const now = Date.now();

    return await ctx.db.insert("todos", {
      title: args.title,
      description: args.description,
      status: "todo",
      priority: args.priority,
      dueDate: args.dueDate,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update todo status (for drag and drop)
export const updateTodoStatus = mutation({
  args: {
    todoId: v.id("todos"),
    status: v.union(
      v.literal("todo"),
      v.literal("in-progress"),
      v.literal("done"),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const todo = await ctx.db.get(args.todoId);
    if (!todo) {
      throw new Error("Todo not found");
    }

    await ctx.db.patch(args.todoId, {
      status: args.status,
      updatedAt: Date.now(),
    });

    return null;
  },
});

// Update todo details
export const updateTodo = mutation({
  args: {
    todoId: v.id("todos"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    priority: v.optional(
      v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    ),
    dueDate: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const todo = await ctx.db.get(args.todoId);
    if (!todo) {
      throw new Error("Todo not found");
    }

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.priority !== undefined) updates.priority = args.priority;
    if (args.dueDate !== undefined) updates.dueDate = args.dueDate;

    await ctx.db.patch(args.todoId, updates);

    return null;
  },
});

// Delete a todo
export const deleteTodo = mutation({
  args: {
    todoId: v.id("todos"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const todo = await ctx.db.get(args.todoId);
    if (!todo) {
      throw new Error("Todo not found");
    }

    await ctx.db.delete(args.todoId);

    return null;
  },
});
