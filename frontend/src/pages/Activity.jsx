import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import RecentActivity from '../components/RecentActivity';
import { Activity as ActivityIcon } from 'lucide-react';

const Activity = () => {
  const navigate = useNavigate();
  const [friends, setFriends] = useState([]);
  const [groups, setGroups] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [friendsRes, groupsRes, activitiesRes] = await Promise.all([
        api.get('/api/friends/'),
        api.get('/api/groups/'),
        api.get('/api/activity/'),
      ]);
      setFriends(friendsRes.data);
      setGroups(groupsRes.data);
      setActivities(activitiesRes.data);
    } catch (err) {
      console.error('Failed to fetch activity data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8">
        {/* Left column sidebar navigation */}
        <Sidebar
          groups={groups}
          friends={friends}
          onAddGroup={() => navigate('/groups/create')}
          onAddFriend={() => navigate('/friends')}
        />

        {/* Main Panel */}
        <main className="flex-1 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm min-h-[500px]">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-50">
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <ActivityIcon className="h-6 w-6 text-emerald-600" />
              <span>Recent Activity</span>
            </h1>
          </div>

          <div className="max-w-3xl">
            <RecentActivity activities={activities} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Activity;
