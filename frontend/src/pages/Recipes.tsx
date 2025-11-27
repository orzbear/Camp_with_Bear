import { Layout } from '../components/Layout';

export function Recipes() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-16 px-4">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Camping Recipes</h1>
          <p className="text-lg text-gray-600 mb-6">Coming Soon</p>
          <div className="text-left max-w-2xl mx-auto">
            <p className="text-gray-700 mb-4">
              We're working on a feature that will help you generate meal plans for your camping trips.
            </p>
            <p className="text-gray-700 mb-4">
              This feature will allow you to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
              <li>Generate meal plans based on your trip duration and group size</li>
              <li>Get recipe suggestions based on your available equipment</li>
              <li>Plan meals according to dietary preferences and restrictions</li>
              <li>Create shopping lists for your camping meals</li>
            </ul>
            <p className="text-gray-600 text-sm">
              Stay tuned for updates!
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

