import { useState, useEffect } from 'react';
import { User } from '../types/user.types';
import { UserService } from '../../../services/user.service';
import { ChannelService } from '../../../services/channel.service';
import { LoadingSpinner } from '../../../features/shared/components/LoadingSpinner';
import { Modal } from '../../../features/shared/components/Modal';
import { useUserContext } from '../../../contexts/UserContext';

interface UserInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserInviteModal = ({ isOpen, onClose }: UserInviteModalProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { userId } = useUserContext();

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        const [userData, channelData] = await Promise.all([
          UserService.getUsers(),
          ChannelService.getChannels()
        ]);

        if (Array.isArray(userData)) {
          // Get list of usernames that already have DM channels
          const existingDMUsernames = channelData.directMessages.map(dm => 
            dm.name.replace('dm-', '')
          );

          // Filter out current user and users who already have DM channels
          const filteredUsers = userData.filter(user => 
            user.id !== userId && !existingDMUsernames.includes(user.username)
          );
          
          setUsers(filteredUsers);
          setError(null);
        } else {
          setUsers([]);
          setError('Invalid data received from server');
        }
      } catch (err) {
        setUsers([]);
        setError('Failed to load users');
        console.error('Error loading users:', err);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      loadUsers();
    }
  }, [isOpen, userId]);

  const handleUserClick = async (user: User) => {
    try {
      // Create a private channel for DM with the target user's username
      await ChannelService.createChannel({
        name: `dm-${user.username}`,
        isPrivate: true,
        members: [user.id]
      });
      onClose();
    } catch (err) {
      console.error('Error creating DM channel:', err);
      setError('Failed to start direct message');
    }
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Direct Messages">
      <div className="flex flex-col h-full">
        <div className="p-4">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 mb-4 border rounded focus:outline-none focus:border-primary text-black"
          />
          
          {loading && (
            <div className="flex justify-center py-4">
              <LoadingSpinner />
            </div>
          )}
          
          {error && (
            <div className="text-red-500 text-sm mb-4">{error}</div>
          )}
          
          {!loading && !error && filteredUsers.length === 0 && (
            <div className="text-gray-500 text-center py-4">
              No users found
            </div>
          )}
          
          <div className="space-y-2">
            {filteredUsers.map(user => (
              <button
                key={user.id}
                onClick={() => handleUserClick(user)}
                className="w-full text-left p-2 hover:bg-white/25 active:bg-white/25 rounded transition-colors text-black"
              >
                {user.username}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}; 