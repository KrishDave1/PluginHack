import React from "react";

const PDF = () => {
  return (
    <div className="bg-gray-100 min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold mb-4">Generate PDF Report</h1>
      <button
        onClick={generatePDF}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-blue-700"
      >
        Download PDF
      </button>
    </div>
  );
};

export default PDF;
