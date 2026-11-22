import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listTasks,
  updateTaskStatus,
  type TaskSummary,
  type TaskStatus,
  type TaskPriority,
  TASK_STATUS_LABELS,
  TASK_STATUS_STYLES,
  TASK_PRIORITY_STYLES,
  getTaskDueDateInfo,
} from './tasksApi';
import { TaskModal } from './TaskModal';
import { TaskDetailModal, formatTaskDisplayDate } from './TaskDetailModal';
import { getMembers } from '../members/membersApi';
import { listEvents } from '../events/eventsApi';
import { useIsInsideAuthenticatedLayout } from '../../components/layout/AuthenticatedLayoutContext';

export function TasksPage() {
  const isInsideLayout = useIsInsideAuthenticatedLayout();
  const queryClient = useQueryClient();

  // Active view tab: 'ALL' | 'MINE' | 'COMPLETED'
  const [activeTab, setActiveTab] = useState<'ALL' | 'MINE' | 'COMPLETED'>('ALL');

  // Filters state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [eventFilter, setEventFilter] = useState<string>('');
  const [memberFilter, setMemberFilter] = useState<string>('');
  const [page, setPage] = useState(1);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskSummary | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskSummary | null>(null);

  // Fetch Members & Events for filter dropdowns
  const { data: members = [] } = useQuery({
    queryKey: ['members'],
    queryFn: getMembers,
  });

  const { data: eventsData } = useQuery({
    queryKey: ['events', 'filter-select'],
    queryFn: () => listEvents({ limit: 100 }),
  });
  const events = eventsData?.events ?? [];

  // Determine query parameters based on tab and filters
  const queryParams = useMemo(() => {
    let effectiveStatus: TaskStatus | 'ALL' | undefined = undefined;
    if (activeTab === 'COMPLETED') {
      effectiveStatus = 'COMPLETED';
    } else if (statusFilter !== 'ALL') {
      effectiveStatus = statusFilter as TaskStatus;
    }

    return {
      page,
      limit: 15,
      mine: activeTab === 'MINE' ? true : undefined,
      status: effectiveStatus,
      priority: priorityFilter !== 'ALL' ? (priorityFilter as TaskPriority) : undefined,
      eventId: eventFilter || undefined,
      assignedMemberId: memberFilter || undefined,
      search: search.trim() || undefined,
    };
  }, [page, activeTab, statusFilter, priorityFilter, eventFilter, memberFilter, search]);

  // Tasks Query
  const {
    data: tasksResponse,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['tasks', queryParams],
    queryFn: () => listTasks(queryParams),
  });

  const tasks = tasksResponse?.data ?? [];
  const pagination = tasksResponse?.pagination ?? { page: 1, limit: 15, total: 0, totalPages: 1 };
  const summary = tasksResponse?.summary ?? {
    total: 0,
    todo: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0,
  };

  // Status toggle mutation
  const toggleMutation = useMutation({
    mutationFn: async ({
      taskId,
      currentStatus,
    }: {
      taskId: string;
      currentStatus: TaskStatus;
    }) => {
      const nextStatus: TaskStatus = currentStatus === 'COMPLETED' ? 'TO_DO' : 'COMPLETED';
      return updateTaskStatus(taskId, nextStatus);
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      if (selectedTask?.id === updated.id) {
        setSelectedTask(updated);
      }
    },
  });

  const hasActiveFilters =
    search.trim() !== '' ||
    statusFilter !== 'ALL' ||
    priorityFilter !== 'ALL' ||
    eventFilter !== '' ||
    memberFilter !== '';

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setPriorityFilter('ALL');
    setEventFilter('');
    setMemberFilter('');
    setPage(1);
  };

  const handleOpenDetail = (task: TaskSummary) => {
    setSelectedTask(task);
  };

  const handleOpenEdit = (task: TaskSummary) => {
    setEditingTask(task);
    setIsCreateModalOpen(true);
  };

  const completionPercentage =
    summary.total > 0 ? Math.round((summary.completed / summary.total) * 100) : 0;

  return (
    <div
      className={`min-h-screen bg-[#FAFAF3] ${isInsideLayout ? 'p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto' : 'p-6 max-w-7xl mx-auto'
        }`}
    >
      {/* Page Header with Right-Aligned Task Statistics */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-6">
        {/* Left Side: Title, Subtitle, and Create Task Action */}
        <div className="space-y-3 lg:max-w-md xl:max-w-lg">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#556251]" />
              <span className="text-xs font-semibold uppercase tracking-widest text-[#8D493A]">
                Wedding Workspace
              </span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1A1C18] mt-1">
              Tasks & Checklists
            </h1>
            <p className="text-xs sm:text-sm text-[#716B64] mt-1 leading-relaxed">
              Organize ceremony deadlines, assign roles to family members, and track wedding
              milestones.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setEditingTask(null);
              setIsCreateModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#8D493A] hover:bg-[#723B2F] text-white text-xs font-semibold transition-all shadow-xs cursor-pointer shrink-0"
          >
            <span className="text-base leading-none">+</span>
            <span>Create Task</span>
          </button>
        </div>

        {/* Right Side: Compact Summary Statistics Ribbon */}
        <div className="bg-white rounded-2xl border border-[#EAE6E1] p-3 sm:p-4 shadow-2xs w-full lg:w-auto shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:flex lg:items-center gap-3 sm:gap-4 lg:gap-0 lg:divide-x lg:divide-[#EAE6E1]">
            {/* Total Tasks */}
            <div className="lg:px-4 py-1 flex flex-col items-center sm:items-start text-center sm:text-left">
              <span className="text-[10px] font-bold text-[#86736D] uppercase tracking-wider block">
                Total Tasks
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1C18]">
                  {summary.total}
                </span>
                <span className="text-[11px] text-[#716B64]">scheduled</span>
              </div>
            </div>

            {/* To Do */}
            <div className="lg:px-4 py-1 flex flex-col items-center sm:items-start text-center sm:text-left">
              <span className="text-[10px] font-bold text-[#86736D] uppercase tracking-wider block">
                To Do
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="font-serif text-2xl sm:text-3xl font-bold text-[#716B64]">
                  {summary.todo}
                </span>
                <span className="text-[11px] text-[#716B64]">pending</span>
              </div>
            </div>

            {/* In Progress */}
            <div className="lg:px-4 py-1 flex flex-col items-center sm:items-start text-center sm:text-left">
              <span className="text-[10px] font-bold text-[#86736D] uppercase tracking-wider block">
                In Progress
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="font-serif text-2xl sm:text-3xl font-bold text-[#1D4ED8]">
                  {summary.inProgress}
                </span>
                <span className="text-[11px] text-[#1D4ED8]">active</span>
              </div>
            </div>

            {/* Completed */}
            <div className="lg:px-4 py-1 flex flex-col items-center sm:items-start text-center sm:text-left min-w-[130px]">
              <div className="flex items-center justify-between w-full gap-2">
                <span className="text-[10px] font-bold text-[#86736D] uppercase tracking-wider block">
                  Completed
                </span>
                <span className="text-[10px] font-bold text-[#2E7D32] bg-[#EDF7EE] px-1.5 py-0.2 rounded-full">
                  {completionPercentage}%
                </span>
              </div>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="font-serif text-2xl sm:text-3xl font-bold text-[#2E7D32]">
                  {summary.completed}
                </span>
                <span className="text-[11px] text-[#716B64]">of {summary.total}</span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-[#EAE6E1] rounded-full h-1 mt-1.5 overflow-hidden">
                <div
                  className="bg-[#2E7D32] h-full rounded-full transition-all duration-500"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-3xl border border-[#EAE6E1] shadow-xs overflow-hidden">
        {/* Navigation Tabs with balanced horizontal spacing */}
        <div className="flex items-center gap-6 sm:gap-8 px-6 pt-4 border-b border-[#EAE6E1] overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => {
              setActiveTab('ALL');
              setPage(1);
            }}
            className={`pb-3.5 pt-1 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 relative -mb-px ${activeTab === 'ALL'
                ? 'border-[#8D493A] text-[#8D493A]'
                : 'border-transparent text-[#716B64] hover:text-[#1A1C18]'
              }`}
          >
            <span>All Tasks</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activeTab === 'ALL'
                  ? 'bg-[#8D493A]/10 text-[#8D493A]'
                  : 'bg-[#F4F2EE] text-[#716B64]'
                }`}
            >
              ({summary.total})
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('MINE');
              setPage(1);
            }}
            className={`pb-3.5 pt-1 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 relative -mb-px ${activeTab === 'MINE'
                ? 'border-[#8D493A] text-[#8D493A]'
                : 'border-transparent text-[#716B64] hover:text-[#1A1C18]'
              }`}
          >
            <span>My Tasks</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('COMPLETED');
              setPage(1);
            }}
            className={`pb-3.5 pt-1 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 relative -mb-px ${activeTab === 'COMPLETED'
                ? 'border-[#8D493A] text-[#8D493A]'
                : 'border-transparent text-[#716B64] hover:text-[#1A1C18]'
              }`}
          >
            <span>Completed</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activeTab === 'COMPLETED'
                  ? 'bg-[#8D493A]/10 text-[#8D493A]'
                  : 'bg-[#F4F2EE] text-[#716B64]'
                }`}
            >
              ({summary.completed})
            </span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="p-4 sm:p-5 bg-[#FAF9F5] border-b border-[#EAE6E1] flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Redesigned Search Input with SVG icon and Clear button */}
          <div className="relative flex-1 min-w-[220px]">
            <span className="absolute inset-y-0 left-3 flex items-center text-[#86736D] pointer-events-none">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search tasks by title..."
              className="w-full pl-9 pr-9 py-2 h-10 rounded-xl border border-[#D8C2BB] bg-white text-xs text-[#1A1C18] placeholder-[#A09890] hover:border-[#8D493A]/40 focus:border-[#8D493A] focus:outline-hidden focus:ring-2 focus:ring-[#8D493A]/15 transition-all shadow-2xs"
            />
            {search.trim() !== '' && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setPage(1);
                }}
                className="absolute inset-y-0 right-2.5 flex items-center text-[#A09890] hover:text-[#1A1C18] p-1 cursor-pointer transition-colors"
                aria-label="Clear search"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter (only shown if not in Completed tab) */}
            {activeTab !== 'COMPLETED' && (
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 rounded-xl border border-[#D8C2BB] bg-white text-xs font-medium text-[#1A1C18] focus:outline-hidden focus:ring-2 focus:ring-[#8D493A]/20"
              >
                <option value="ALL">All Statuses</option>
                <option value="TO_DO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            )}

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-[#D8C2BB] bg-white text-xs font-medium text-[#1A1C18] focus:outline-hidden focus:ring-2 focus:ring-[#8D493A]/20"
            >
              <option value="ALL">All Priorities</option>
              <option value="HIGH">High Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="LOW">Low Priority</option>
            </select>

            {/* Ceremony / Event Filter */}
            <select
              value={eventFilter}
              onChange={(e) => {
                setEventFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-[#D8C2BB] bg-white text-xs font-medium text-[#1A1C18] focus:outline-hidden focus:ring-2 focus:ring-[#8D493A]/20 max-w-[150px] truncate"
            >
              <option value="">All Ceremonies</option>
              <option value="none">General Tasks Only</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name}
                </option>
              ))}
            </select>

            {/* Assignee Filter (only shown if not in My Tasks tab) */}
            {activeTab !== 'MINE' && (
              <select
                value={memberFilter}
                onChange={(e) => {
                  setMemberFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 rounded-xl border border-[#D8C2BB] bg-white text-xs font-medium text-[#1A1C18] focus:outline-hidden focus:ring-2 focus:ring-[#8D493A]/20 max-w-[150px] truncate"
              >
                <option value="">All Assignees</option>
                <option value="none">Unassigned Only</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.user.displayName?.trim() || m.user.email}
                  </option>
                ))}
              </select>
            )}

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-3 py-2 rounded-xl border border-[#D8C2BB] bg-white hover:bg-[#FAF8F5] text-xs font-semibold text-[#8D493A] transition-colors cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Task List Content */}
        <div className="divide-y divide-[#EAE6E1]">
          {isLoading ? (
            <div className="py-16 text-center text-[#716B64] space-y-2">
              <div className="w-6 h-6 border-2 border-[#8D493A] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs">Loading tasks...</p>
            </div>
          ) : isError ? (
            <div className="py-16 text-center text-[#D32F2F] space-y-3">
              <p className="text-sm font-semibold">Failed to load wedding tasks.</p>
              <button
                type="button"
                onClick={() => refetch()}
                className="px-4 py-2 rounded-xl bg-[#8D493A] text-white text-xs font-semibold hover:bg-[#723B2F] cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : tasks.length === 0 ? (
            <div className="py-16 px-4 text-center max-w-md mx-auto space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#FAF9F5] border border-[#EAE6E1] flex items-center justify-center mx-auto text-xl">
                📋
              </div>
              <h3 className="font-serif text-lg font-semibold text-[#1A1C18]">
                {hasActiveFilters ? 'No tasks match your filters' : 'No tasks created yet'}
              </h3>
              <p className="text-xs text-[#716B64] leading-relaxed">
                {hasActiveFilters
                  ? 'Try adjusting your search query, priority, or ceremony filters.'
                  : 'Start organizing ceremony milestones, assigning responsibilities to your wedding team.'}
              </p>
              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="px-4 py-2 rounded-xl border border-[#D8C2BB] text-xs font-semibold text-[#8D493A] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                >
                  Clear Filters
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-[#8D493A] hover:bg-[#723B2F] text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
                >
                  Create Your First Task
                </button>
              )}
            </div>
          ) : (
            tasks.map((task) => {
              const priorityStyle = TASK_PRIORITY_STYLES[task.priority];
              const statusStyle = TASK_STATUS_STYLES[task.status];
              const isCompleted = task.status === 'COMPLETED';

              return (
                <div
                  key={task.id}
                  className={`p-4 sm:p-5 hover:bg-[#FAF9F5]/70 transition-all flex items-start justify-between gap-3 sm:gap-4 ${isCompleted ? 'bg-[#FAF9F5]/40 opacity-75' : ''
                    }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    {/* Status Checkbox */}
                    <button
                      type="button"
                      onClick={() =>
                        toggleMutation.mutate({
                          taskId: task.id,
                          currentStatus: task.status,
                        })
                      }
                      aria-label={
                        isCompleted
                          ? `Mark ${task.title} as incomplete`
                          : `Mark ${task.title} as completed`
                      }
                      className={`w-5 h-5 rounded-lg border mt-0.5 flex items-center justify-center transition-all shrink-0 cursor-pointer ${isCompleted
                          ? 'bg-[#8D493A] border-[#8D493A] text-white'
                          : 'border-[#D8C2BB] hover:border-[#8D493A] bg-white'
                        }`}
                    >
                      {isCompleted && (
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="3"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </button>

                    {/* Task Info - Left side: Title, Description, and Metadata */}
                    <div
                      className="min-w-0 flex-1 cursor-pointer"
                      onClick={() => handleOpenDetail(task)}
                    >
                      {/* Task Title on its own clear line */}
                      <h3
                        className={`font-semibold text-sm sm:text-base text-[#1A1C18] hover:text-[#8D493A] transition-colors ${isCompleted ? 'line-through text-[#86736D]' : ''
                          }`}
                      >
                        {task.title}
                      </h3>

                      {/* Description Preview on its own line */}
                      {task.description && (
                        <p className="text-xs text-[#716B64] mt-0.5 line-clamp-1">
                          {task.description}
                        </p>
                      )}

                      {/* Metadata Chips: Due Date | Assignee | Ceremony */}
                      <div className="flex items-center gap-3 sm:gap-4 mt-2 flex-wrap text-[11px] text-[#716B64]">
                        {/* Due Date with improved states */}
                        {(() => {
                          const dueInfo = getTaskDueDateInfo(task.dueDate, task.status);
                          return (
                            <span
                              className={`inline-flex items-center gap-1.5 ${dueInfo.className}`}
                            >
                              <svg
                                className="w-3.5 h-3.5 shrink-0"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="1.8"
                                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                              <span>{dueInfo.text}</span>
                              {dueInfo.badgeLabel && (
                                <span className={dueInfo.badgeClassName}>{dueInfo.badgeLabel}</span>
                              )}
                            </span>
                          );
                        })()}

                        {/* Related Ceremony */}
                        {task.event && (
                          <span className="inline-flex items-center gap-1 text-[#53433E]">
                            <svg
                              className="w-3.5 h-3.5 text-[#8D493A] shrink-0"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="1.8"
                                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                              />
                            </svg>
                            <span className="font-medium text-[#1A1C18]">{task.event.name}</span>
                          </span>
                        )}

                        {/* Assignee */}
                        {task.assignedMember ? (
                          <span className="inline-flex items-center gap-1.5 text-[#53433E]">
                            <span className="w-4.5 h-4.5 rounded-full bg-[#8D493A]/10 text-[#8D493A] font-bold text-[9px] flex items-center justify-center shrink-0">
                              {task.assignedMember.name.slice(0, 2).toUpperCase()}
                            </span>
                            <span>{task.assignedMember.name}</span>
                          </span>
                        ) : (
                          <span className="text-[#A09890] italic">Unassigned</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Side: [Priority Badge] [Status Badge] [Edit] [View] */}
                  <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 self-start sm:self-center flex-wrap sm:flex-nowrap justify-end pt-0.5 sm:pt-0">
                    {/* Priority Badge */}
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border tracking-wide uppercase shrink-0 ${priorityStyle.bg} ${priorityStyle.text} ${priorityStyle.border}`}
                    >
                      {priorityStyle.label}
                    </span>

                    {/* Status Badge */}
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border shrink-0 ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                      {TASK_STATUS_LABELS[task.status]}
                    </span>

                    {/* Edit Icon Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(task)}
                      aria-label={`Edit ${task.title}`}
                      className="p-1.5 rounded-lg text-[#716B64] hover:text-[#8D493A] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                      title="Edit task"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.8"
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                      </svg>
                    </button>

                    {/* View Details Icon Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenDetail(task)}
                      aria-label={`View details for ${task.title}`}
                      className="p-1.5 rounded-lg text-[#716B64] hover:text-[#8D493A] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                      title="View details"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.8"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.8"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-[#EAE6E1] bg-[#FAF9F5] flex items-center justify-between text-xs text-[#716B64]">
            <span>
              Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} total
              tasks)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page <= 1}
                className="px-3 py-1.5 rounded-lg border border-[#D8C2BB] bg-white disabled:opacity-40 hover:bg-[#FAF8F5] cursor-pointer"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1.5 rounded-lg border border-[#D8C2BB] bg-white disabled:opacity-40 hover:bg-[#FAF8F5] cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <TaskModal
        isOpen={isCreateModalOpen}
        initialTask={editingTask}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingTask(null);
        }}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        }}
      />

      {/* Details Modal */}
      <TaskDetailModal
        isOpen={Boolean(selectedTask)}
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onEdit={(task) => {
          setSelectedTask(null);
          handleOpenEdit(task);
        }}
        onTaskUpdated={(updated) => {
          setSelectedTask(updated);
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        }}
        onTaskDeleted={() => {
          setSelectedTask(null);
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        }}
      />
    </div>
  );
}
