import React, { useState } from 'react';

const ColorOptions = () => {
  const [selectedColor, setSelectedColor] = useState('light-blue');

  const colorOptions = [
    {
      id: 'light-blue',
      name: 'Light Blue',
      textClass: 'text-blue-200',
      description: 'Soft, easy on the eyes',
      sample: 'This is how the text will look'
    },
    {
      id: 'neon-blue',
      name: 'Neon Blue',
      textClass: 'text-neon-blue',
      description: 'Bright cyan with glow effect',
      sample: 'This is how the text will look'
    },
    {
      id: 'neon-purple',
      name: 'Neon Purple',
      textClass: 'text-purple-300',
      description: 'Vibrant and modern',
      sample: 'This is how the text will look'
    },
    {
      id: 'bright-white',
      name: 'Bright White',
      textClass: 'text-white',
      description: 'High contrast, maximum readability',
      sample: 'This is how the text will look'
    }
  ];

  return (
    <div className="min-h-screen bg-dark-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Choose Text Color</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {colorOptions.map((option) => (
            <div
              key={option.id}
              className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
                selectedColor === option.id
                  ? 'border-neon-blue bg-dark-800'
                  : 'border-gray-700 bg-dark-800/50 hover:border-gray-600'
              }`}
              onClick={() => setSelectedColor(option.id)}
            >
              <h3 className="text-xl font-semibold text-white mb-2">{option.name}</h3>
              <p className="text-gray-400 mb-4 text-sm">{option.description}</p>
              <div className={`${option.textClass} text-lg font-medium`}>
                {option.sample}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-dark-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-white mb-4">Preview with Selected Color:</h2>
          <div className={`${colorOptions.find(c => c.id === selectedColor)?.textClass} text-lg leading-relaxed`}>
            <div className="text-4xl font-bold mb-4">Transform Your Voice Into Any Instrument</div>
            <div className="text-xl">
              Create professional music with AI-powered tools. Record your voice, apply real-time effects, and transform it into orchestral masterpieces or electronic beats.
            </div>
            <div className="mt-4 text-base">
              Join thousands of musicians, content creators, and educators who are transforming their creative process with Studio Nexus.
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-gray-400 mb-4">Click on any color option above to see how it looks!</p>
          <p className="text-sm text-gray-500">
            The neon blue option includes a subtle glow effect that makes text pop against dark backgrounds.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ColorOptions;