import React, { useState, useEffect } from 'react';
import { fundraiserService, authService, extractDataArray } from '../../services/api';
import { KanbanSquare, Plus, CheckCircle2, Clock, AlertTriangle, ArrowRight, User, Filter } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { Skeleton } from '../../components/common/UiHelpers';
import { format } from 'date-fns';
import { toast } from 'sonner';

export const AdminTasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [fundraisers, setFundraisers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [taskModalOpen, setTaskModalOpen] = useState(false);

  const [newTaskData, setNewTaskData] = useState({
    fundraiser: '',
    title: '',
    description: '',
    assignee_id: '',
    priority: 'MEDIUM',
    due_date: new Date().toISOString().slice(0, 10),
    status: 'TODO',
    progress: 0,
  });

  const fetchData = async () => {
    try {
      const [tRes, fRes, uRes] = await Promise.all([
        fundraiserService.getAllTasks(),
        fundraiserService.getFundraisers(),
        authService.getUsers()
      ]);
      setTasks(extractDataArray(tRes));
      const fList = extractDataArray(fRes);
      setFundraisers(fList);
      if (fList.length > 0 && !newTaskData.fundraiser) {
        setNewTaskData(prev => ({ ...prev, fundraiser: String(fList[0].id) }));
      }
      setUsers(extractDataArray(uRes));
    } catch {
      toast.error('Failed to load tasks board.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      const progressVal = newStatus === 'COMPLETED' ? 100 : newStatus === 'TODO' ? 0 : 50;
      await fundraiserService.updateTask(taskId, {
        status: newStatus,
        progress: progressVal,
      });
      toast.success(`Task moved to ${newStatus.replace('_', ' ')}.`);
      fetchData();
    } catch (err) {
      toast.error('Failed to update task.');
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskData.fundraiser) {
      toast.error('Please select a fundraiser campaign.');
      return;
    }
    try {
      await fundraiserService.createFundraiserTask(newTaskData.fundraiser, {
        ...newTaskData,
        fundraiser: parseInt(newTaskData.fundraiser),
        assignee_id: newTaskData.assignee_id ? parseInt(newTaskData.assignee_id) : null,
      });
      toast.success('New task created.');
      setTaskModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to create task.');
    }
  };

  const columns = [
    { key: 'TODO', title: 'To Do', color: 'bg-slate-100 text-slate-800' },
    { key: 'IN_PROGRESS', title: 'In Progress', color: 'bg-amber-100 text-amber-800' },
    { key: 'BLOCKED', title: 'Blocked', color: 'bg-rose-100 text-rose-800' },
    { key: 'COMPLETED', title: 'Completed', color: 'bg-emerald-100 text-emerald-800' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2A1E18] tracking-tight">
            Volunteer Task Kanban Board
          </h1>
          <p className="text-xs sm:text-sm text-[#7A6A5E] mt-1">
            Organize campaign assignments, track volunteer progress, and monitor deadlines
          </p>
        </div>

        <Button size="sm" variant="primary" icon={Plus} onClick={() => setTaskModalOpen(true)}>
          Add Task
        </Button>
      </div>

      {/* Kanban Columns */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
          {columns.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.key);

            return (
              <div key={col.key} className="bg-[#FAF8F5] border border-[#E8DCCE] rounded-xl p-3 space-y-3 flex flex-col min-h-[500px]">
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 border-b border-[#E8DCCE]">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${col.color}`}>
                      {col.title}
                    </span>
                    <span className="text-xs font-bold text-[#7A6A5E]">{colTasks.length}</span>
                  </div>
                </div>

                {/* Tasks List */}
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-1">
                  {colTasks.length === 0 ? (
                    <div className="text-center py-8 text-[11px] text-[#7A6A5E]">
                      No tasks in this column
                    </div>
                  ) : (
                    colTasks.map((task) => (
                      <Card key={task.id} padding="default" className="shadow-xs space-y-2.5">
                        <div className="flex items-center justify-between">
                          <Badge
                            variant={task.priority === 'HIGH' || task.priority === 'URGENT' ? 'danger' : 'coffee'}
                            size="sm"
                          >
                            {task.priority}
                          </Badge>
                          {task.is_overdue && (
                            <Badge variant="danger" size="sm">Overdue</Badge>
                          )}
                        </div>

                        <h4 className="text-xs font-bold text-[#2A1E18] leading-snug">
                          {task.title}
                        </h4>

                        {task.description && (
                          <p className="text-[11px] text-[#7A6A5E] line-clamp-2">
                            {task.description}
                          </p>
                        )}

                        <div className="text-[10px] text-[#8B6353] font-semibold">
                          Campaign: {task.fundraiser_title || 'General'}
                        </div>

                        {/* Progress slider / bar */}
                        <div>
                          <div className="flex justify-between text-[10px] text-[#7A6A5E] mb-1">
                            <span>Progress</span>
                            <span>{task.progress}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-[#FAF8F5] rounded-full overflow-hidden border border-[#E8DCCE]">
                            <div
                              className={`h-full ${task.status === 'COMPLETED' ? 'bg-emerald-600' : 'bg-[#6B4A38]'}`}
                              style={{ width: `${task.progress}%` }}
                            />
                          </div>
                        </div>

                        {/* Assignee & Due Date */}
                        <div className="pt-2 border-t border-[#E8DCCE] flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-[#2A1E18] flex items-center gap-1">
                            <User className="w-3 h-3 text-[#7A6A5E]" />
                            {task.assignee?.name || 'Unassigned'}
                          </span>
                          <span className={`text-[10px] ${task.is_overdue ? 'text-rose-600 font-bold' : 'text-[#7A6A5E]'}`}>
                            Due: {task.due_date}
                          </span>
                        </div>

                        {/* Quick Status Shift Actions */}
                        <div className="pt-1 flex items-center justify-between gap-1">
                          {task.status !== 'TODO' && (
                            <button
                              onClick={() => handleUpdateTaskStatus(task.id, 'TODO')}
                              className="text-[10px] text-[#7A6A5E] hover:underline cursor-pointer"
                            >
                              ← To Do
                            </button>
                          )}
                          {task.status !== 'IN_PROGRESS' && (
                            <button
                              onClick={() => handleUpdateTaskStatus(task.id, 'IN_PROGRESS')}
                              className="text-[10px] text-[#6B4A38] font-bold hover:underline cursor-pointer"
                            >
                              In Progress
                            </button>
                          )}
                          {task.status !== 'COMPLETED' && (
                            <button
                              onClick={() => handleUpdateTaskStatus(task.id, 'COMPLETED')}
                              className="text-[10px] text-emerald-800 font-bold hover:underline cursor-pointer ml-auto"
                            >
                              ✓ Done
                            </button>
                          )}
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Task Modal */}
      <Modal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        title="Create Volunteer Task"
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#2A1E18] uppercase tracking-wider mb-1">
              Fundraiser Campaign
            </label>
            <select
              value={newTaskData.fundraiser}
              onChange={(e) => setNewTaskData({ ...newTaskData, fundraiser: e.target.value })}
              className="w-full bg-white border border-[#E8DCCE] rounded-lg px-3 py-2 text-xs font-semibold text-[#2A1E18] focus:border-[#6B4A38] focus:outline-none"
              required
            >
              {fundraisers.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.title}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Task Title"
            value={newTaskData.title}
            onChange={(e) => setNewTaskData({ ...newTaskData, title: e.target.value })}
            placeholder="e.g. Sponsor Outreach Pitch Deck"
            required
          />

          <div>
            <label className="block text-xs font-semibold text-[#2A1E18] uppercase tracking-wider mb-1">
              Task Description
            </label>
            <textarea
              value={newTaskData.description}
              onChange={(e) => setNewTaskData({ ...newTaskData, description: e.target.value })}
              rows={2}
              className="w-full px-3.5 py-2 text-xs bg-white border border-[#E8DCCE] rounded-lg focus:outline-none focus:border-[#6B4A38]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#2A1E18] uppercase tracking-wider mb-1">
                Assignee
              </label>
              <select
                value={newTaskData.assignee_id}
                onChange={(e) => setNewTaskData({ ...newTaskData, assignee_id: e.target.value })}
                className="w-full bg-white border border-[#E8DCCE] rounded-lg px-3 py-2 text-xs font-semibold text-[#2A1E18] focus:border-[#6B4A38] focus:outline-none"
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2A1E18] uppercase tracking-wider mb-1">
                Priority
              </label>
              <select
                value={newTaskData.priority}
                onChange={(e) => setNewTaskData({ ...newTaskData, priority: e.target.value })}
                className="w-full bg-white border border-[#E8DCCE] rounded-lg px-3 py-2 text-xs font-semibold text-[#2A1E18] focus:border-[#6B4A38] focus:outline-none"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          <Input
            label="Due Date"
            type="date"
            min={new Date().toISOString().slice(0, 10)}
            value={newTaskData.due_date}
            onChange={(e) => setNewTaskData({ ...newTaskData, due_date: e.target.value })}
            required
          />

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E8DCCE]">
            <Button variant="ghost" size="sm" onClick={() => setTaskModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Create Task
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
