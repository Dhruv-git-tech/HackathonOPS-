import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Users, Github, Presentation, Video, Star, CheckCircle } from 'lucide-react';

const JudgeDashboard = () => {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [scores, setScores] = useState({});
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const judgeId = user?.username;

  useEffect(() => {
    fetchAssignedTeams();
  }, []);

  const fetchAssignedTeams = async () => {
    try {
      const response = await axios.get(`/api/judges/${judgeId}/teams`);
      setTeams(response.data);
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScoreSubmit = async () => {
    if (!selectedTeam || Object.keys(scores).length === 0) return;

    setSubmitting(true);
    try {
      await axios.post(`/api/judges/${judgeId}/score`, {
        teamId: selectedTeam._id,
        criteria: scores,
        comments: comments
      });

      // Update the team's scored status
      setTeams(teams.map(team => 
        team._id === selectedTeam._id 
          ? { ...team, hasScored: true }
          : team
      ));

      setSelectedTeam(null);
      setScores({});
      setComments('');
    } catch (error) {
      console.error('Error submitting scores:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const scoringCriteria = [
    { key: 'innovation', label: 'Innovation & Creativity', maxScore: 10 },
    { key: 'technical', label: 'Technical Complexity', maxScore: 10 },
    { key: 'feasibility', label: 'Feasibility & Implementation', maxScore: 10 },
    { key: 'presentation', label: 'Presentation Quality', maxScore: 10 },
    { key: 'impact', label: 'Potential Impact', maxScore: 10 }
  ];

  const totalScore = Object.values(scores).reduce((sum, score) => sum + (parseInt(score) || 0), 0);
  const maxTotalScore = scoringCriteria.reduce((sum, criteria) => sum + criteria.maxScore, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Judge Dashboard</h1>
        <p className="text-gray-600">Evaluate assigned teams and submit scores</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Assigned Teams</p>
              <p className="text-3xl font-bold text-gray-900">{teams.length}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Scored Teams</p>
              <p className="text-3xl font-bold text-gray-900">
                {teams.filter(team => team.hasScored).length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Remaining</p>
              <p className="text-3xl font-bold text-gray-900">
                {teams.filter(team => !team.hasScored).length}
              </p>
            </div>
            <Star className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Teams List */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Your Assigned Teams</h3>
        </div>
        
        {teams.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {teams.map((team) => (
              <div key={team._id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="text-lg font-medium text-gray-900">{team.teamName}</h4>
                      {team.hasScored && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs flex items-center">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Scored
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-2">{team.problemStatement || 'No problem statement'}</p>
                    {team.track && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                        {team.track}
                      </span>
                    )}
                  </div>
                  
                  <button
                    onClick={() => setSelectedTeam(team)}
                    className="btn-primary"
                    disabled={team.hasScored}
                  >
                    {team.hasScored ? 'Already Scored' : 'Score Team'}
                  </button>
                </div>

                {/* Project Links */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  {team.githubLink && (
                    <a
                      href={team.githubLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      <Github className="w-4 h-4" />
                      <span>GitHub Repository</span>
                    </a>
                  )}
                  {team.presentationLink && (
                    <a
                      href={team.presentationLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 text-green-600 hover:text-green-800 text-sm"
                    >
                      <Presentation className="w-4 h-4" />
                      <span>Presentation</span>
                    </a>
                  )}
                  {team.videoLink && (
                    <a
                      href={team.videoLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 text-purple-600 hover:text-purple-800 text-sm"
                    >
                      <Video className="w-4 h-4" />
                      <span>Demo Video</span>
                    </a>
                  )}
                </div>

                {/* Team Members */}
                <div className="mt-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Team Members:</h5>
                  <div className="flex flex-wrap gap-2">
                    {team.members?.map((member, index) => (
                      <span
                        key={index}
                        className={`px-2 py-1 rounded-full text-xs ${
                          member.isLead 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {member.name} {member.isLead && '(Lead)'}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-4" />
            <p>No teams assigned yet</p>
          </div>
        )}
      </div>

      {/* Scoring Modal */}
      {selectedTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Score Team: {selectedTeam.teamName}</h2>
                <button
                  onClick={() => setSelectedTeam(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Team Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">{selectedTeam.problemStatement}</h3>
                <div className="flex space-x-4 text-sm">
                  {selectedTeam.githubLink && (
                    <a
                      href={selectedTeam.githubLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      <Github className="w-4 h-4 mr-1" />
                      Repository
                    </a>
                  )}
                  {selectedTeam.presentationLink && (
                    <a
                      href={selectedTeam.presentationLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-800 flex items-center"
                    >
                      <Presentation className="w-4 h-4 mr-1" />
                      Slides
                    </a>
                  )}
                  {selectedTeam.videoLink && (
                    <a
                      href={selectedTeam.videoLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:text-purple-800 flex items-center"
                    >
                      <Video className="w-4 h-4 mr-1" />
                      Demo
                    </a>
                  )}
                </div>
              </div>

              {/* Scoring Criteria */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Scoring Criteria</h3>
                {scoringCriteria.map((criteria) => (
                  <div key={criteria.key} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <label className="font-medium text-gray-900">{criteria.label}</label>
                      <span className="text-sm text-gray-600">Max: {criteria.maxScore}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="range"
                        min="0"
                        max={criteria.maxScore}
                        value={scores[criteria.key] || 0}
                        onChange={(e) => setScores({
                          ...scores,
                          [criteria.key]: parseInt(e.target.value)
                        })}
                        className="flex-1"
                      />
                      <span className="w-8 text-center font-medium">
                        {scores[criteria.key] || 0}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Score */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-blue-900">Total Score:</span>
                  <span className="text-2xl font-bold text-blue-900">
                    {totalScore} / {maxTotalScore}
                  </span>
                </div>
              </div>

              {/* Comments */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comments (Optional)
                </label>
                <textarea
                  rows={4}
                  className="form-input"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Add any additional comments about the team's project..."
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setSelectedTeam(null)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleScoreSubmit}
                  disabled={submitting || totalScore === 0}
                  className="btn-primary flex items-center space-x-2"
                >
                  {submitting ? (
                    <>
                      <div className="loading-spinner"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Submit Score</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JudgeDashboard;