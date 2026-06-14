import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import InviteFriendsCard from './InviteFriendsCard';
import { LayoutDashboard, Activity, Receipt, Plus, Users, User, ArrowRight } from 'lucide-react';

const Sidebar = ({ groups = [], friends = [], onAddGroup, onAddFriend }) => {
  return (
    <aside className="w-full md:w-64 shrink-0 flex flex-col gap-6">
      {/* Navigation menu */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">
          Navigation
        </span>
        <nav className="space-y-1">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3.5 py-2 text-sm font-semibold rounded-xl transition ${
                isActive
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <LayoutDashboard className="h-4.5 w-4.5" />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/activity"
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3.5 py-2 text-sm font-semibold rounded-xl transition ${
                isActive
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <Activity className="h-4.5 w-4.5" />
            <span>Recent Activity</span>
          </NavLink>

          <NavLink
            to="/calculators"
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3.5 py-2 text-sm font-semibold rounded-xl transition ${
                isActive
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <Receipt className="h-4.5 w-4.5" />
            <span>Calculators</span>
          </NavLink>
        </nav>
      </div>

      {/* Groups Section */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col">
        <div className="flex justify-between items-center mb-3 px-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Groups
          </span>
          <button
            onClick={onAddGroup || (() => {})}
            className="p-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition cursor-pointer"
            title="Create group"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        {groups.length === 0 ? (
          <div className="py-5 px-3 text-center border border-dashed border-gray-100 rounded-xl bg-gray-50/50">
            <p className="text-[11px] font-medium text-gray-400">You do not have any groups yet.</p>
          </div>
        ) : (
          <ul className="space-y-1 max-h-40 overflow-y-auto pr-1">
            {groups.map((group) => (
              <li key={group.id}>
                <Link
                  to={`/groups/${group.id}`}
                  className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Users className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <span className="truncate">{group.name}</span>
                  </div>
                  <ArrowRight className="h-3 w-3 text-gray-300 group-hover:text-gray-500 shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Friends Section */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col">
        <div className="flex justify-between items-center mb-3 px-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Friends
          </span>
          <button
            onClick={onAddFriend || (() => {})}
            className="p-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition cursor-pointer"
            title="Add friend"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        {friends.length === 0 ? (
          <div className="py-5 px-3 text-center border border-dashed border-gray-100 rounded-xl bg-gray-50/50">
            <p className="text-[11px] font-medium text-gray-400">You have not added any friends yet.</p>
          </div>
        ) : (
          <ul className="space-y-1 max-h-40 overflow-y-auto pr-1">
            {friends.map((friendship) => (
              <li key={friendship.id}>
                <Link
                  to="/friends"
                  className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition"
                >
                  <div className="flex items-center gap-2 truncate">
                    {friendship.friend_avatar_base64 ? (
                      <img
                        src={friendship.friend_avatar_base64}
                        alt={friendship.friend_username}
                        className="w-3.5 h-3.5 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <User className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    )}
                    <span className="truncate">{friendship.friend_username}</span>
                  </div>
                  {parseFloat(friendship.balance) !== 0 && (
                    <span
                      className={`text-[10px] font-bold shrink-0 ${
                        parseFloat(friendship.balance) > 0 ? 'text-emerald-600' : 'text-orange-500'
                      }`}
                    >
                      {parseFloat(friendship.balance) > 0
                        ? `+₹${parseFloat(friendship.balance).toFixed(0)}`
                        : `-₹${Math.abs(parseFloat(friendship.balance)).toFixed(0)}`}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Invite Friends widget */}
      <InviteFriendsCard />
    </aside>
  );
};

export default Sidebar;
