import React, { useState } from 'react';
import ProviderSidebar from './ProviderSidebar';
import { 
  Camera, Edit, Save, Star, MapPin, Mail, Phone, Globe,
  Users, Calendar, Award, Building2, X, Plus, Upload, Eye
} from 'lucide-react';

export default function ProviderProfile() {
  const [isEditMode, setIsEditMode] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Company Info State
  const [companyInfo, setCompanyInfo] = useState({
    name: 'Al-Nahda Builders',
    logo: '/photo_2025-08-13_21-03-51.png',
    about: 'Leading construction company specializing in modern residential and commercial projects. With over 15 years of experience, we deliver quality construction with innovative technologies.',
    phone: '+966 50 123 4567',
    email: 'info@alnahda.sa',
    website: 'www.alnahda.sa',
    address: 'Riyadh, Saudi Arabia'
  });

  // Services & Technologies
  const availableServices = [
    '3D Printing', 'ICF (Insulated Concrete Forms)', 'Prefabricated Construction',
    'Sustainable Materials', 'Smart Home Integration', 'Green Building',
    'BIM Technology', 'Modular Construction', 'Steel Frame', 'Concrete',
    'Wood Frame', 'Solar Integration', 'Precast System'
  ];
  
  const [selectedServices, setSelectedServices] = useState([
    '3D Printing', 'ICF (Insulated Concrete Forms)', 'Prefabricated Construction', 'Sustainable Materials', 'Precast System'
  ]);

  // Experience State
  const [experience, setExperience] = useState({
    yearsInBusiness: 15,
    teamSize: 85,
    licenses: 'Commercial Building License #12345, Residential License #67890',
    certifications: ['ISO 9001:2015', 'LEED Certified', 'Safety Certification'],
    regionsServed: ['Riyadh', 'Jeddah', 'Dammam', 'Eastern Province']
  });

  // Portfolio State
  const [portfolio, setPortfolio] = useState([
    {
      id: 1,
      title: 'Luxury Villa Complex',
      type: 'Residential',
      budgetRange: '15M - 20M SAR',
      location: 'Riyadh',
      completionDate: '2023',
      results: '20 luxury villas completed on time, 100% client satisfaction'
    },
    {
      id: 2,
      title: 'Modern Office Tower',
      type: 'Commercial',
      budgetRange: '50M - 60M SAR',
      location: 'Jeddah',
      completionDate: '2023',
      results: '15-story office building with LEED Gold certification'
    },
    {
      id: 3,
      title: 'Educational Campus',
      type: 'Educational',
      budgetRange: '30M - 35M SAR',
      location: 'Dammam',
      completionDate: '2022',
      results: 'State-of-the-art campus serving 2000+ students'
    }
  ]);

  const stats = [
    { label: 'Projects Completed', value: '47', icon: Building2, color: 'orange' },
    { label: 'Average Rating', value: '4.8/5', icon: Star, color: 'blue' },
    { label: 'Years Experience', value: experience.yearsInBusiness, icon: Calendar, color: 'orange' },
    { label: 'Team Members', value: experience.teamSize, icon: Users, color: 'blue' }
  ];

  const toggleService = (service) => {
    if (selectedServices.includes(service)) {
      setSelectedServices(selectedServices.filter(s => s !== service));
    } else {
      setSelectedServices([...selectedServices, service]);
    }
  };

  const handleSave = () => {
    setIsEditMode(false);
    console.log('Profile saved:', { companyInfo, selectedServices, experience, portfolio });
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30">
      <ProviderSidebar />

      <main className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Company Profile</h1>
              <p className="text-slate-600">Manage your company information and portfolio</p>
            </div>
            <div className="flex items-center gap-3">
              {isEditMode ? (
                <>
                  <button
                    onClick={() => setIsEditMode(false)}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-orange-200 text-slate-700 font-medium hover:bg-orange-50 transition-all"
                  >
                    <X className="w-5 h-5" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 text-white font-medium hover:shadow-lg transition-all"
                  >
                    <Save className="w-5 h-5" />
                    Save Changes
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setShowPreview(true)}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-orange-200 text-orange-600 font-medium hover:bg-orange-50 transition-all"
                  >
                    <Eye className="w-5 h-5" />
                    Preview
                  </button>
                  <button
                    onClick={() => setIsEditMode(true)}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 text-white font-medium hover:shadow-lg transition-all"
                  >
                    <Edit className="w-5 h-5" />
                    Edit Profile
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-2xl border-2 border-orange-100 p-6 hover:shadow-lg transition-all">
              <div className={`p-3 rounded-xl ${stat.color === 'orange' ? 'bg-orange-100' : 'bg-blue-100'} inline-flex mb-4`}>
                <stat.icon className={`w-6 h-6 ${stat.color === 'orange' ? 'text-orange-600' : 'text-blue-600'}`} />
              </div>
              <div className="text-2xl font-bold text-slate-900 mb-1">{stat.value}</div>
              <div className="text-sm text-slate-600">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Company Information */}
        <div className="bg-white rounded-2xl border-2 border-orange-100 p-8 mb-6">
          <div className="flex items-start gap-6">
            {/* Logo */}
            <div className="relative">
              <img 
                src={companyInfo.logo} 
                alt={companyInfo.name}
                className="w-32 h-32 rounded-2xl border-2 border-orange-200 object-cover"
              />
              {isEditMode && (
                <button className="absolute bottom-2 right-2 p-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-all">
                  <Camera className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Company Details */}
            <div className="flex-1">
              {isEditMode ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Company Name</label>
                    <input
                      type="text"
                      value={companyInfo.name}
                      onChange={(e) => setCompanyInfo({...companyInfo, name: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border-2 border-orange-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">About</label>
                    <textarea
                      value={companyInfo.about}
                      onChange={(e) => setCompanyInfo({...companyInfo, about: e.target.value})}
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border-2 border-orange-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-3">{companyInfo.name}</h2>
                  <p className="text-slate-600 mb-4">{companyInfo.about}</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone className="w-4 h-4 text-orange-600" />
                      {companyInfo.phone}
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Mail className="w-4 h-4 text-orange-600" />
                      {companyInfo.email}
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Globe className="w-4 h-4 text-orange-600" />
                      {companyInfo.website}
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <MapPin className="w-4 h-4 text-orange-600" />
                      {companyInfo.address}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Services & Technologies */}
        <div className="bg-white rounded-2xl border-2 border-orange-100 p-8 mb-6">
          <h3 className="text-xl font-bold text-slate-900 mb-4">Services & Technologies</h3>
          <div className="flex flex-wrap gap-3">
            {availableServices.map((service) => (
              <button
                key={service}
                onClick={() => isEditMode && toggleService(service)}
                disabled={!isEditMode}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  selectedServices.includes(service)
                    ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                } ${!isEditMode && 'cursor-default'}`}
              >
                {service}
              </button>
            ))}
          </div>
        </div>

        {/* Experience & Certifications */}
        <div className="bg-white rounded-2xl border-2 border-orange-100 p-8 mb-6">
          <h3 className="text-xl font-bold text-slate-900 mb-6">Experience & Certifications</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Licenses</label>
              {isEditMode ? (
                <textarea
                  value={experience.licenses}
                  onChange={(e) => setExperience({...experience, licenses: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border-2 border-orange-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
                />
              ) : (
                <p className="text-slate-600">{experience.licenses}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Certifications</label>
              <div className="flex flex-wrap gap-2">
                {experience.certifications.map((cert, index) => (
                  <span key={index} className="px-3 py-1.5 bg-orange-50 text-orange-700 rounded-lg text-sm font-medium border border-orange-200">
                    <Award className="w-4 h-4 inline mr-1" />
                    {cert}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Regions Served</label>
              <div className="flex flex-wrap gap-2">
                {experience.regionsServed.map((region, index) => (
                  <span key={index} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-200">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    {region}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Portfolio */}
        <div className="bg-white rounded-2xl border-2 border-orange-100 p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-900">Portfolio</h3>
            {isEditMode && (
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-50 text-orange-600 font-medium hover:bg-orange-100 transition-all">
                <Plus className="w-5 h-5" />
                Add Project
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolio.map((project) => (
              <div key={project.id} className="bg-gradient-to-br from-slate-50 to-orange-50/30 rounded-xl border-2 border-orange-100 p-6 hover:shadow-lg transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 mb-1">{project.title}</h4>
                    <p className="text-sm text-slate-600">{project.type}</p>
                  </div>
                  {isEditMode && (
                    <button className="p-2 rounded-lg hover:bg-orange-100 transition-all">
                      <Edit className="w-4 h-4 text-slate-600" />
                    </button>
                  )}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <MapPin className="w-4 h-4 text-orange-600" />
                    {project.location}
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Calendar className="w-4 h-4 text-orange-600" />
                    Completed {project.completionDate}
                  </div>
                  <div className="text-slate-600 font-medium">
                    {project.budgetRange}
                  </div>
                  <p className="text-slate-600 pt-2 border-t border-orange-100">
                    {project.results}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-orange-200">
              <div className="flex items-start justify-between">
                <h2 className="text-2xl font-bold text-slate-900">Profile Preview</h2>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-slate-600 mt-2">This is how project owners will see your profile</p>
            </div>
            
            <div className="p-6">
              {/* Preview content - simplified version of the profile */}
              <div className="space-y-6">
                <div className="flex items-start gap-6">
                  <img 
                    src={companyInfo.logo} 
                    alt={companyInfo.name}
                    className="w-24 h-24 rounded-xl border-2 border-orange-200"
                  />
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">{companyInfo.name}</h3>
                    <p className="text-slate-600 mb-3">{companyInfo.about}</p>
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                      <span className="font-bold text-slate-900">4.8/5</span>
                      <span className="text-slate-600">(47 projects)</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-bold text-slate-900 mb-3">Technologies</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedServices.map((service, index) => (
                      <span key={index} className="px-3 py-1.5 bg-orange-50 text-orange-700 rounded-lg text-sm font-medium border border-orange-200">
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
