"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import TodoColumn from "./TodoColumn";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Plus, ListTodo } from "lucide-react";



export default function KanbanBoard() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPriority, setNewPriority] = useState<"low" | "medium" | "high">(
    "medium",
  );
  const [newDueDate, setNewDueDate] = useState("");
  const [draggedTodoId, setDraggedTodoId] = useState<string | null>(null);

  const todosData = useQuery(api.todos.getTodos);
  const createTodo = useMutation(api.todos.createTodo);
  const updateTodoStatus = useMutation(api.todos.updateTodoStatus);

  const handleCreateTodo = async () => {
    if (!newTitle.trim()) return;

    await createTodo({
      title: newTitle,
      description: newDescription || undefined,
      priority: newPriority,
      dueDate: newDueDate || undefined,
    });

    // Reset form
    setNewTitle("");
    setNewDescription("");
    setNewPriority("medium");
    setNewDueDate("");
    setIsCreateOpen(false);
  };

  const handleDragStart = (e: React.DragEvent, todoId: string) => {
    setDraggedTodoId(todoId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (
    e: React.DragEvent,
    newStatus: "todo" | "in-progress" | "done",
  ) => {
    e.preventDefault();

    if (!draggedTodoId) return;

    await updateTodoStatus({
      todoId: draggedTodoId as Id<"todos">,
      status: newStatus,
    });

    setDraggedTodoId(null);
  };

  if (!todosData) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <div className="h-7 w-40 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-5 w-64 bg-gray-100 rounded animate-pulse"></div>
          </div>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Columns Skeleton */}
        <div className="grid gap-6 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-4">
              <div className="h-16 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="space-y-3">
                {[...Array(2)].map((_, j) => (
                  <div
                    key={j}
                    className="h-32 bg-gray-100 rounded-lg animate-pulse"
                  ></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const totalTodos =
    todosData.todo.length +
    todosData.in_progress.length +
    todosData.done.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg">
            <ListTodo className="h-5 w-5 text-gray-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Todo Board</h1>
            <p className="text-sm text-gray-500">
              Manage your tasks with {totalTodos}{" "}
              {totalTodos === 1 ? "item" : "items"}
            </p>
          </div>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gray-900 hover:bg-gray-800">
              <Plus className="h-4 w-4 mr-2" />
              Add Todo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Todo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Title *
                </label>
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Enter todo title..."
                  className="border-gray-200"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Description
                </label>
                <Textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Add description..."
                  className="border-gray-200 min-h-[80px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Priority
                  </label>
                  <Select 
                    value={newPriority} 
                    onValueChange={(value) => setNewPriority(value as "low" | "medium" | "high")}
                  >
                    <SelectTrigger className="border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Due Date
                  </label>
                  <Input
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    placeholder="DD/MM/YYYY"
                    className="border-gray-200"
                  />
                </div>
              </div>
              <Button
                onClick={handleCreateTodo}
                className="w-full bg-gray-900 hover:bg-gray-800"
                disabled={!newTitle.trim()}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Todo
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Kanban Columns */}
      <div className="grid gap-6 md:grid-cols-3 h-[calc(100vh-200px)]">
        <TodoColumn
          title="To Do"
          status="todo"
          todos={todosData.todo}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        />
        <TodoColumn
          title="In Progress"
          status="in-progress"
          todos={todosData.in_progress}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        />
        <TodoColumn
          title="Done"
          status="done"
          todos={todosData.done}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        />
      </div>
    </div>
  );
}
