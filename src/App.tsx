
import React from 'react';
import { supabase } from './integrations/supabase/client';

function App() {
  const [connected, setConnected] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    async function checkConnection() {
      try {
        const { error } = await supabase.from('words').select('id').limit(1);
        setConnected(error ? false : true);
      } catch (err) {
        setConnected(false);
        console.error('Error checking connection:', err);
      }
    }
    
    checkConnection();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center mb-6">Supabase Connection</h1>
        
        {connected === null ? (
          <p className="text-center text-gray-600">Checking connection...</p>
        ) : connected ? (
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-green-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
            </div>
            <p className="font-medium text-green-600">Successfully connected to Supabase!</p>
            <p className="mt-2 text-sm text-gray-600">
              Your database contains tables for words, sentence templates, and word templates.
            </p>
          </div>
        ) : (
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-red-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </div>
            </div>
            <p className="font-medium text-red-600">Failed to connect to Supabase</p>
            <p className="mt-2 text-sm text-gray-600">
              Please check your configuration and try again.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
