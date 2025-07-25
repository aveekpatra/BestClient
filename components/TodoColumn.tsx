"use client";

import { Id } from "../convex/_generated/dataModel";
import TodoCard from "./TodoCard";
import { Circle, Clock, CheckCircle2 } from "lucide-react";

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

interface TodoColumnProps {
  title: string;
  status: "todo" | "in-progress" | "done";
  todos: Todo[];
  onDragStart: (e: React.DragEvent, todoId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, status: "todo" | "in-progress" | "done") => void;
}

export default function TodoColumn({
  title,
  status,
  todos,
  onDragStart,
  onDragOver,
  onDrop,
}: TodoColumnProps) {
  const getColumnIcon = (status: string) => {
    switch (status) {
      case "todo":
        return <Circle className="h-4 w-4 text-gray-500" />;
      case "in-progress":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "done":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  };

  const getColumnHeaderColor = (status: string) => {
    switch (status) {
      case "todo":
        return "bg-gray-50 border-gray-200";
      case "in-progress":
        return "bg-blue-50 border-blue-200";
      case "done":
        return "bg-green-50 border-green-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const getDropZoneColor = (status: string) => {
    switch (status) {
      case "todo":
        return "border-gray-300 bg-gray-50";
      case "in-progress":
        return "border-blue-300 bg-blue-50";
      case "done":
        return "border-green-300 bg-green-50";
      default:
        return "border-gray-300 bg-gray-50";
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Column Header */}
      <div
        className={`flex items-center justify-between p-3 border-b rounded-t-lg ${getColumnHeaderColor(status)}`}
      >
        <div className="flex items-center gap-2">
          {getColumnIcon(status)}
          <h3 className="font-medium text-gray-900">{title}</h3>
        </div>
        <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-md border">
          {todos.length}
        </span>
      </div>

      {/* Drop Zone */}
      <div
        className="flex-1 p-3 space-y-2 min-h-[400px] bg-gray-25 border border-t-0 rounded-b-lg"
        onDragOver={onDragOver}
        onDrop={(e) => onDrop(e, status)}
      >
        {todos.length === 0 ? (
          <div
            className={`h-20 border-2 border-dashed rounded-lg flex items-center justify-center transition-colors ${getDropZoneColor(status)}`}
          >
            <p className="text-sm text-gray-500">Drop todos here</p>
          </div>
        ) : (
          todos.map((todo) => (
            <TodoCard key={todo._id} todo={todo} onDragStart={onDragStart} />
          ))
        )}
      </div>
    </div>
  );
}
