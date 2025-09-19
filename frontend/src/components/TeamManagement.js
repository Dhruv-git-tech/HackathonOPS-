import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Users, Mail, Github, Presentation, Video, Edit, Star } from 'lucide-react';

const TeamManagement = () => {
  const [teams, setTeams] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (searchQuery.trim()) {
      searchTeams();
    } else {
      setTeams([]);
    }
  }, [searchQuery]);

  const searchTeams = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`/api/teams/search?q=${encodeURIComponent(searchQuery)}`);
      setTeams(response.data);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTeamClick = async (team) => {
    try {
      const response = await axios.get(`/api/teams/${team._id}`);
      setSelectedTeam(response.data);
    } catch (error) {
      console.error('Error fetching team details:', error);
    }
  };

  const handleUpdateTeam = async (teamData) => {
    try {
      await axios.put(`/api/teams/${selectedTeam._id}`, teamData);
      setSelectedTeam({ ...selectedTeam, ...teamData });
      setEditMode(false);
      
      // Update the team in the search results
      setTeams(teams.map(team => 
        team._id === selectedTeam._id ? { ...team, ...teamData } : team
      ));
    } catch (error) {
      console.error('Error updating team:', error);
    }
  };

  const TeamDetailModal = () => {
    if (!selectedTeam) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">{selectedTeam.teamName}</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => setEditMode(!editMode)}
                  className="btn-secondary flex items-center space-x-1"
                >
                  <Edit className="w-4 h-4" />
                  <span>{editMode ? 'Cancel' : 'Edit'}</span>
                </button>
                <button
                  onClick={() => setSelectedTeam(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Team Information */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Team Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Problem Statement</label>
                    {editMode ? (
                      <input
                        type="text"
                        className="form-input mt-1"
                        value={selectedTeam.problemStatement || ''}
                        onChange={(e) => setSelectedTeam({...selectedTeam, problemStatement: e.target.value})}
                      />
                    ) : (
                      <p className="text-gray-900 mt-1">{selectedTeam.problemStatement || 'Not specified'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Track</label>
                    {editMode ? (
                      <input
                        type="text"
                        className="form-input mt-1"
                        value={selectedTeam.track || ''}
                        onChange={(e) => setSelectedTeam({...selectedTeam, track: e.target.value})}
                      />
                    ) : (
                      <p className="text-gray-900 mt-1">{selectedTeam.track || 'Not specified'}</p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Project Links</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 flex items-center">
                      <Github className="w-4 h-4 mr-1" />
                      GitHub/GitLab Link
                    </label>
                    {editMode ? (
                      <input
                        type="url"
                        className="form-input mt-1"
                        value={selectedTeam.githubLink || ''}
                        onChange={(e) => setSelectedTeam({...selectedTeam, githubLink: e.target.value})}
                        placeholder="https://github.com/..."
                      />
                    ) : (
                      <a
                        href={selectedTeam.githubLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 mt-1 block"
                      >
                        {selectedTeam.githubLink || 'Not provided'}
                      </a>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 flex items-center">
                      <Presentation className="w-4 h-4 mr-1" />
                      Presentation Link
                    </label>
                    {editMode ? (
                      <input
                        type="url"
                        className="form-input mt-1"
                        value={selectedTeam.presentationLink || ''}
                        onChange={(e) => setSelectedTeam({...selectedTeam, presentationLink: e.target.value})}
                        placeholder="https://docs.google.com/..."
                      />
                    ) : (
                      <a
                        href={selectedTeam.presentationLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 mt-1 block"
                      >
                        {selectedTeam.presentationLink || 'Not provided'}
                      </a>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 flex items-center">
                      <Video className="w-4 h-4 mr-1" />
                      Video/Demo Link
                    </label>
                    {editMode ? (
                      <input
                        type="url"
                        className="form-input mt-1"
                        value={selectedTeam.videoLink || ''}
                        onChange={(e) => setSelectedTeam({...selectedTeam, videoLink: e.target.value})}
                        placeholder="https://youtube.com/..."
                      />
                    ) : (
                      <a
                        href={selectedTeam.videoLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 mt-1 block"
                      >
                        {selectedTeam.videoLink || 'Not provided'}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Team Members */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Team Members
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {selectedTeam.members?.map((member, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{member.name}</h4>
                      {member.isLead && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs flex items-center">
                          <Star className="w-3 h-3 mr-1" />
                          Team Lead
                        </span>
                      )}
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p className="flex items-center">
                        <Mail className="w-3 h-3 mr-1" />
                        {member.email}
                      </p>
                      <p>Gender: {member.gender}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Scores */}
            {selectedTeam.scores && selectedTeam.scores.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Judging Scores</h3>
                <div className="space-y-4">
                  {selectedTeam.scores.map((score, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium text-gray-900">Judge: {score.judgeId}</h4>
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
                          Total: {score.totalScore}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        {Object.entries(score.criteria).map(([criterion, value]) => (
                          <div key={criterion} className="text-center">
                            <p className="text-gray-600 capitalize">{criterion}</p>
                            <p className="font-medium">{value}</p>
                          </div>
                        ))}
                      </div>
                      {score.comments && (
                        <div className="mt-2 p-2 bg-white rounded text-sm">
                          <p className="text-gray-600">Comments:</p>
                          <p className="text-gray-900">{score.comments}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {editMode && (
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setEditMode(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUpdateTeam({
                    problemStatement: selectedTeam.problemStatement,
                    track: selectedTeam.track,
                    githubLink: selectedTeam.githubLink,
                    presentationLink: selectedTeam.presentationLink,
                    videoLink: selectedTeam.videoLink
                  })}
                  className="btn-primary"
                >
                  Save Changes
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Team Management</h1>
        <p className="text-gray-600">Search and manage team information and project submissions</p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by team name, participant name, or email..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Search Results */}
      {searchQuery && (
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Search Results {teams.length > 0 && `(${teams.length})`}
            </h3>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="loading-spinner mx-auto"></div>
              <p className="text-gray-600 mt-2">Searching...</p>
            </div>
          ) : teams.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {teams.map((team) => (
                <div
                  key={team._id}
                  onClick={() => handleTeamClick(team)}
                  className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="text-lg font-medium text-gray-900 mb-2">{team.teamName}</h4>
                      <p className="text-gray-600 mb-2">{team.problemStatement || 'No problem statement'}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          {team.members?.length || 0} members
                        </span>
                        {team.track && (
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            {team.track}
                          </span>
                        )}
                        {team.githubLink && (
                          <span className="flex items-center text-green-600">
                            <Github className="w-4 h-4 mr-1" />
                            Submitted
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      Click to view details
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : searchQuery ? (
            <div className="p-8 text-center text-gray-500">
              No teams found matching "{searchQuery}"
            </div>
          ) : null}
        </div>
      )}

      {!searchQuery && (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Start Searching</h3>
          <p className="text-gray-600">Enter a team name, participant name, or email to find teams</p>
        </div>
      )}

      <TeamDetailModal />
    </div>
  );
};

export default TeamManagement;