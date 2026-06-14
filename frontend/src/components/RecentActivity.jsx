import React from 'react';
import {
  PlusCircle,
  Edit,
  Trash2,
  CheckCircle,
  UserPlus,
  UserMinus,
  MessageSquare,
  Clock,
  Activity
} from 'lucide-react';

const RecentActivity = ({ activities = [], limit }) => {
  const displayed = limit ? activities.slice(0, limit) : activities;

  const getIcon = (type) => {
    switch (type) {
      case 'expense_created':
        return <PlusCircle className="h-4 w-4 text-emerald-600" />;
      case 'expense_updated':
        return <Edit className="h-4 w-4 text-blue-600" />;
      case 'expense_deleted':
        return <Trash2 className="h-4 w-4 text-red-600" />;
      case 'settlement_made':
        return <CheckCircle className="h-4 w-4 text-emerald-600" />;
      case 'member_added':
        return <UserPlus className="h-4 w-4 text-indigo-600" />;
      case 'member_removed':
        return <UserMinus className="h-4 w-4 text-orange-600" />;
      case 'chat_message':
        return <MessageSquare className="h-4 w-4 text-teal-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getIconBg = (type) => {
    switch (type) {
      case 'expense_created':
      case 'settlement_made':
        return 'bg-emerald-50 border-emerald-100';
      case 'expense_updated':
        return 'bg-blue-50 border-blue-100';
      case 'expense_deleted':
        return 'bg-red-50 border-red-100';
      case 'member_added':
        return 'bg-indigo-50 border-indigo-100';
      case 'member_removed':
        return 'bg-orange-50 border-orange-100';
      case 'chat_message':
        return 'bg-teal-50 border-teal-100';
      default:
        return 'bg-gray-50 border-gray-100';
    }
  };

  if (displayed.length === 0) {
    return (
      <div className="text-center py-10 px-4 border border-dashed border-gray-100 rounded-xl bg-gray-50/50">
        <Activity className="h-8 w-8 text-gray-300 mx-auto mb-2" />
        <p className="text-xs font-semibold text-gray-500">No activity recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {displayed.map((activity, activityIdx) => (
          <li key={activity.id}>
            <div className="relative pb-8">
              {activityIdx !== displayed.length - 1 ? (
                <span
                  className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-100"
                  aria-hidden="true"
                />
              ) : null}
              <div className="relative flex space-x-3">
                <div>
                  <span
                    className={`h-8 w-8 rounded-xl flex items-center justify-center border shrink-0 ${getIconBg(
                      activity.type
                    )}`}
                  >
                    {getIcon(activity.type)}
                  </span>
                </div>
                <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-800">
                      {activity.description}
                    </p>
                  </div>
                  <div className="text-right text-[10px] whitespace-nowrap text-gray-400 font-semibold flex items-center gap-1 shrink-0">
                    <Clock className="h-3 w-3" />
                    <time dateTime={activity.created_at}>
                      {new Date(activity.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </time>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RecentActivity;
