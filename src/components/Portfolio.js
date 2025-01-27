import React, { useState } from 'react';
import { Sun, Moon, Download, Code, Book, Briefcase } from 'lucide-react';

const Portfolio = () => {
  const [darkMode, setDarkMode] = useState(true);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      {/* Navigation */}
      <nav className={`fixed w-full ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-xl font-bold">Your Name</h1>
            <div className="flex items-center space-x-4">
              <button onClick={toggleDarkMode} className="p-2 rounded-full hover:bg-gray-700">
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <a href="#" className="hover:text-blue-700">About</a>
              <a href="#" className="hover:text-blue-700">Projects</a>
              <a href="#" className="hover:text-blue-700">Publications</a>
              <a href="#" className="hover:text-blue-700">Contact</a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-6">Sales Engineer & Software Developer</h1>
          <p className="text-xl mb-8">Specializing in Electromagnetic Simulation & Software Development</p>
          <button className="flex items-center mx-auto px-6 py-3 bg-blue-900 text-white rounded-lg hover:bg-blue-800">
            <Download className="mr-2" size={20} />
            Download Resume
          </button>
        </div>
      </section>

      {/* Skills Section */}
      <section className={`py-12 px-4 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">Core Competencies</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
              <Code className="mb-4 text-blue-700" size={32} />
              <h3 className="text-xl font-bold mb-2">Software Development</h3>
              <p>Full-stack development with modern technologies and frameworks</p>
            </div>
            <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
              <Book className="mb-4 text-blue-700" size={32} />
              <h3 className="text-xl font-bold mb-2">Research Publications</h3>
              <p>Published research in electromagnetic simulation and analysis</p>
            </div>
            <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
              <Briefcase className="mb-4 text-blue-700" size={32} />
              <h3 className="text-xl font-bold mb-2">Industry Experience</h3>
              <p>Professional experience at Remcom in EM simulation</p>
            </div>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">Featured Projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((project) => (
              <div key={project} className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
                <h3 className="text-xl font-bold mb-2">Project Title {project}</h3>
                <p className="mb-4">Brief description of the project and your role in it.</p>
                <div className="flex space-x-2">
                  <span className={`px-3 py-1 rounded-full text-sm ${darkMode ? 'bg-blue-900' : 'bg-blue-100'}`}>
                    Tech Stack
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Publications Section */}
      <section className={`py-12 px-4 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">Research Publications</h2>
          <div className="space-y-6">
            {[1, 2, 3].map((pub) => (
              <div key={pub} className={`p-6 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                <h3 className="text-xl font-bold mb-2">Publication Title {pub}</h3>
                <p className="mb-4">Authors, Journal/Conference, Year</p>
                <p>Brief description of the research and its impact.</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">Get in Touch</h2>
          <p className="text-xl mb-6">Interested in discussing opportunities? Let's connect!</p>
          <button className="px-6 py-3 bg-blue-900 text-white rounded-lg hover:bg-blue-800">
            Contact Me
          </button>
        </div>
      </section>
    </div>
  );
};

export default Portfolio;