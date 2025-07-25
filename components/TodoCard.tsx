"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
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
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle2,
} from "lucide-react";

interface Todo {
  _id: Id<"todos">;
  title: string;
  description?: string;
  status: "todo" | "in-progress" | "done";
  priority: "low" | "medium" | "high";
  dueDate?: string;
  createdAt: number;
  updatedAt: number;
}

interface TodoCardProps {
  todo: Todo;
  onDragStart: (e: React.DragEvent, todoId: string) => void;
}

export default function TodoCard({ todo, onDragStart }: TodoCardProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);
  const [editDescription, setEditDescription] = useState(
    todo.description || "",
  );
  const [editPriority, setEditPriority] = useState(todo.priority);
  const [editDueDate, setEditDueDate] = useState(todo.dueDate || "");

  const updateTodo = useMutation(api.todos.updateTodo);
  const deleteTodo = useMutation(api.todos.deleteTodo);

  const handleEdit = async () => {
    await updateTodo({
      todoId: todo._id,
      title: editTitle,
      description: editDescription,
      priority: editPriority,
      dueDate: editDueDate || undefined,
    });
    setIsEditOpen(false);
  };

  const handleDelete = async () => {
    await deleteTodo({ todoId: todo._id });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-50 text-red-700 border-red-200";
      case "medium":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "low":
        return "bg-green-50 text-green-700 border-green-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high":
        return <AlertCircle className="h-3 w-3" />;
      case "medium":
        return <Clock className="h-3 w-3" />;
      case "low":
        return <CheckCircle2 className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const [day, month, year] = dateStr.split("/");
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";

    return dateStr;
  };

  const isOverdue = (dateStr: string) => {
    if (!dateStr) return false;
    const [day, month, year] = dateStr.split("/");
    const dueDate = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
    );
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, todo._id)}
      className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-all duration-200 cursor-move group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-medium text-gray-900 text-sm line-clamp-2 flex-1">
          {todo.title}
        </h3>
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 h-5 w-5 p-0"
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Todo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Title
                </label>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="border-gray-200"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Description
                </label>
                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="border-gray-200 min-h-[80px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Priority
                  </label>
                  <Select
                    value={editPriority}
                    onValueChange={(value) =>
                      setEditPriority(value as "low" | "medium" | "high")
                    }
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
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    placeholder="DD/MM/YYYY"
                    className="border-gray-200"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleEdit}
                  className="flex-1 bg-gray-900 hover:bg-gray-800"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Update
                </Button>
                <Button
                  onClick={handleDelete}
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Description */}
      {todo.description && (
        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
          {todo.description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-2">
        {/* Priority Badge */}
        <span
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium border ${getPriorityColor(todo.priority)}`}
        >
          {getPriorityIcon(todo.priority)}
          {todo.priority}
        </span>

        {/* Due Date */}
        {todo.dueDate && (
          <span
            className={`inline-flex items-center gap-1 text-xs ${
              isOverdue(todo.dueDate) ? "text-red-600" : "text-gray-500"
            }`}
          >
            <Calendar className="h-3 w-3" />
            {formatDate(todo.dueDate)}
          </span>
        )}
      </div>
    </div>
  );
}
