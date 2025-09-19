import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { Upload, FileText, CheckCircle, AlertCircle, Download } from 'lucide-react';

const DataImport = () => {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const onDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post('/api/teams/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setResult(response.data);
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to import data');
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxFiles: 1,
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Data Import</h1>
        <p className="text-gray-600">Upload CSV or XLSX files to import team and participant data</p>
      </div>

      {/* File Format Requirements */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">File Format Requirements</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Required Columns:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Team_Name</li>
              <li>• Problem_Statement_Title</li>
              <li>• Track (optional)</li>
              <li>• Member_1_Name, Member_1_Email, Member_1_Gender</li>
              <li>• Member_2_Name, Member_2_Email, Member_2_Gender</li>
              <li>• ... up to Member_6_Name, Member_6_Email, Member_6_Gender</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Validation Rules:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Each team must have exactly 6 members</li>
              <li>• At least one female member per team</li>
              <li>• Valid email addresses required</li>
              <li>• Gender: Male/Female/M/F (case insensitive)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Upload Area */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-primary-400 bg-primary-50'
              : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
          }`}
        >
          <input {...getInputProps()} />
          <div className="space-y-4">
            <div className="flex justify-center">
              <Upload className="w-12 h-12 text-gray-400" />
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900">
                {isDragActive ? 'Drop the file here' : 'Drag & drop your file here'}
              </p>
              <p className="text-gray-600">or click to select file</p>
            </div>
            <div className="flex justify-center space-x-4 text-sm text-gray-500">
              <span className="flex items-center">
                <FileText className="w-4 h-4 mr-1" />
                CSV
              </span>
              <span className="flex items-center">
                <FileText className="w-4 h-4 mr-1" />
                XLSX
              </span>
            </div>
          </div>
        </div>

        {uploading && (
          <div className="mt-6 text-center">
            <div className="inline-flex items-center space-x-2 text-primary-600">
              <div className="loading-spinner"></div>
              <span>Processing file...</span>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center space-x-2 mb-4">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Import Results</h3>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-2xl font-bold text-green-800">{result.importedCount}</p>
              <p className="text-sm text-green-600">Teams Imported</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-2xl font-bold text-red-800">{result.errors?.length || 0}</p>
              <p className="text-sm text-red-600">Errors Found</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-2xl font-bold text-blue-800">{result.importedCount * 6}</p>
              <p className="text-sm text-blue-600">Participants Added</p>
            </div>
          </div>

          {result.importedTeams && result.importedTeams.length > 0 && (
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-2">Successfully Imported Teams:</h4>
              <div className="bg-gray-50 rounded-lg p-4 max-h-32 overflow-y-auto">
                <div className="flex flex-wrap gap-2">
                  {result.importedTeams.map((teamName, index) => (
                    <span
                      key={index}
                      className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs"
                    >
                      {teamName}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {result.errors && result.errors.length > 0 && (
            <div>
              <h4 className="font-medium text-red-800 mb-2 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                Errors ({result.errors.length}):
              </h4>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-40 overflow-y-auto">
                <ul className="text-sm text-red-700 space-y-1">
                  {result.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Sample Template */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Need a Template?</h3>
        <p className="text-gray-600 mb-4">
          Download our sample CSV template to ensure your data is formatted correctly.
        </p>
        <button className="btn-secondary flex items-center space-x-2">
          <Download className="w-4 h-4" />
          <span>Download Sample Template</span>
        </button>
      </div>
    </div>
  );
};

export default DataImport;