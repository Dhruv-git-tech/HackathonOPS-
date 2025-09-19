import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Award, Download, QrCode, Users, CheckCircle, AlertCircle } from 'lucide-react';

const CertificateGeneration = () => {
  const [teams, setTeams] = useState([]);
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [certificateType, setCertificateType] = useState('Participation');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (searchQuery.trim()) {
      searchTeams();
    }
  }, [searchQuery]);

  const searchTeams = async () => {
    try {
      const response = await axios.get(`/api/teams/search?q=${encodeURIComponent(searchQuery)}`);
      setTeams(response.data);
    } catch (error) {
      console.error('Error searching teams:', error);
    }
  };

  const handleTeamToggle = (teamId) => {
    setSelectedTeams(prev => 
      prev.includes(teamId) 
        ? prev.filter(id => id !== teamId)
        : [...prev, teamId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTeams.length === teams.length) {
      setSelectedTeams([]);
    } else {
      setSelectedTeams(teams.map(team => team._id));
    }
  };

  const handleGenerateCertificates = async () => {
    if (selectedTeams.length === 0) return;

    setGenerating(true);
    setResult(null);

    try {
      const response = await axios.post('/api/certificates/generate', {
        teamIds: selectedTeams,
        certificateType: certificateType
      });

      setResult(response.data);
      setSelectedTeams([]);
    } catch (error) {
      console.error('Error generating certificates:', error);
      setResult({ 
        success: false, 
        error: error.response?.data?.detail || 'Failed to generate certificates' 
      });
    } finally {
      setGenerating(false);
    }
  };

  const certificateTypes = [
    'Participation',
    'Winner - First Place',
    'Winner - Second Place', 
    'Winner - Third Place',
    'Best Innovation',
    'Best Technical Implementation',
    'People\'s Choice'
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Certificate Generation</h1>
        <p className="text-gray-600">Generate QR-verified digital certificates for participants</p>
      </div>

      {/* Certificate Features */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
          <Award className="w-5 h-5 mr-2" />
          Certificate Features
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-2 text-blue-800">
            <QrCode className="w-4 h-4" />
            <span className="text-sm">QR Code Verification</span>
          </div>
          <div className="flex items-center space-x-2 text-blue-800">
            <Award className="w-4 h-4" />
            <span className="text-sm">Professional Template</span>
          </div>
          <div className="flex items-center space-x-2 text-blue-800">
            <Download className="w-4 h-4" />
            <span className="text-sm">Bulk PDF Download</span>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Teams
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Enter team name to search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Certificate Type
            </label>
            <select
              className="form-input"
              value={certificateType}
              onChange={(e) => setCertificateType(e.target.value)}
            >
              {certificateTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Team Selection */}
      {teams.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Select Teams ({selectedTeams.length} selected)
              </h3>
              <button
                onClick={handleSelectAll}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {selectedTeams.length === teams.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {teams.map((team) => {
              const isSelected = selectedTeams.includes(team._id);
              const participantCount = team.members?.length || 0;
              
              return (
                <div
                  key={team._id}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                  onClick={() => handleTeamToggle(team._id)}
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleTeamToggle(team._id)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900">{team.teamName}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {team.problemStatement || 'No problem statement'}
                          </p>
                          <div className="flex items-center space-x-4 mt-2">
                            <span className="flex items-center text-sm text-gray-500">
                              <Users className="w-4 h-4 mr-1" />
                              {participantCount} members
                            </span>
                            {team.track && (
                              <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                                {team.track}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          {participantCount} certificates
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {selectedTeams.length > 0 && (
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">
                    {selectedTeams.reduce((total, teamId) => {
                      const team = teams.find(t => t._id === teamId);
                      return total + (team?.members?.length || 0);
                    }, 0)}
                  </span> certificates will be generated for <span className="font-medium">{selectedTeams.length}</span> teams
                </div>
                <button
                  onClick={handleGenerateCertificates}
                  disabled={generating}
                  className="btn-primary flex items-center space-x-2"
                >
                  {generating ? (
                    <>
                      <div className="loading-spinner"></div>
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Award className="w-4 h-4" />
                      <span>Generate Certificates</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          {result.success ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="w-6 h-6" />
                <h3 className="text-lg font-semibold">Certificates Generated Successfully!</h3>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800">
                  <span className="font-medium">{result.certificateIds?.length || 0}</span> certificates have been generated.
                </p>
                <p className="text-sm text-green-700 mt-1">
                  Each certificate includes a unique QR code for verification.
                </p>
              </div>

              <div className="flex space-x-4">
                <button className="btn-primary flex items-center space-x-2">
                  <Download className="w-4 h-4" />
                  <span>Download All Certificates</span>
                </button>
                <button className="btn-secondary">
                  View Certificate Preview
                </button>
              </div>

              {/* Certificate IDs */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Generated Certificate IDs:</h4>
                <div className="max-h-32 overflow-y-auto">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-mono">
                    {result.certificateIds?.map((id, index) => (
                      <div key={index} className="bg-white px-2 py-1 rounded border">
                        {id.substring(0, 8)}...
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="w-6 h-6" />
              <div>
                <h3 className="font-semibold">Error Generating Certificates</h3>
                <p className="text-sm">{result.error}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* No Teams */}
      {searchQuery && teams.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Teams Found</h3>
          <p className="text-gray-600">Try searching with a different term</p>
        </div>
      )}

      {/* Getting Started */}
      {!searchQuery && (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <Award className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Generate Certificates</h3>
          <p className="text-gray-600 mb-4">
            Search for teams above to start generating certificates
          </p>
          <div className="text-sm text-gray-500">
            <p>Each certificate will include:</p>
            <ul className="mt-2 space-y-1">
              <li>• Participant's full name and team name</li>
              <li>• Event name and issue date</li>
              <li>• Unique QR code for verification</li>
              <li>• Professional certificate template</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificateGeneration;