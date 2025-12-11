import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Bell, 
  Shield, 
  CreditCard, 
  FileText,
  ChevronRight,
  Check
} from 'lucide-react';
import { Sidebar } from '../components/layout';
import { Card, Button, Input, Toggle, Select, Modal } from '../components/ui';
import { useAuthStore, useSettingsStore } from '../store';
import { templates, specialties, pricingPlans } from '../data';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const { selectedTemplate, setTemplate, autoSave, notifications, toggleAutoSave, toggleNotifications } = useSettingsStore();
  
  const [activeTab, setActiveTab] = useState('general');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    specialty: user?.specialty || 'General Medicine',
  });

  const tabs = [
    { id: 'general', label: 'General', icon: <User size={18} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
    { id: 'templates', label: 'Templates', icon: <FileText size={18} /> },
    { id: 'security', label: 'Account & Security', icon: <Shield size={18} /> },
  ];

  const handleProfileSave = () => {
    updateUser({
      name: profileForm.name,
      specialty: profileForm.specialty,
    });
    toast.success('Profile updated successfully');
  };

  return (
    <Sidebar>
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">
            Manage your account settings and preferences.
          </p>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:w-64 flex-shrink-0"
          >
            <Card className="p-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left ${
                    activeTab === tab.id
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {tab.icon}
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </Card>

            {/* Subscription Card */}
            <Card className="p-4 mt-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">Current Plan</span>
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                  {user?.subscriptionPlan || 'Trial'}
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-3">
                {user?.subscriptionStatus === 'trial' 
                  ? 'Your trial ends in 14 days'
                  : `${user?.subscriptionPlan} plan`
                }
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => setShowUpgradeModal(true)}
              >
                <CreditCard size={16} className="mr-2" />
                Upgrade Plan
              </Button>
            </Card>
          </motion.div>

          {/* Content Area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1"
          >
            {activeTab === 'general' && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">General Settings</h2>
                
                <div className="space-y-6">
                  <Input
                    label="Full Name"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  />
                  
                  <Input
                    label="Email"
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    disabled
                    helperText="Email cannot be changed"
                  />
                  
                  <Select
                    label="Specialty"
                    value={profileForm.specialty}
                    onChange={(e) => setProfileForm({ ...profileForm, specialty: e.target.value })}
                    options={specialties.map(s => ({ value: s, label: s }))}
                  />

                  <div className="pt-4 border-t border-gray-200">
                    <Button onClick={handleProfileSave}>
                      Save Changes
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {activeTab === 'notifications' && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Notification Settings</h2>
                
                <div className="space-y-6">
                  <Toggle
                    enabled={notifications}
                    onChange={toggleNotifications}
                    label="Push Notifications"
                    description="Receive notifications about your notes and account"
                  />
                  
                  <Toggle
                    enabled={autoSave}
                    onChange={toggleAutoSave}
                    label="Auto-Save"
                    description="Automatically save notes while editing"
                  />

                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="font-medium text-gray-900 mb-4">Email Notifications</h3>
                    <div className="space-y-4">
                      {[
                        { label: 'Weekly Summary', description: 'Receive a weekly summary of your activity' },
                        { label: 'Note Reminders', description: 'Get reminded about unsigned notes' },
                        { label: 'Product Updates', description: 'Learn about new features and improvements' },
                      ].map((item, index) => (
                        <Toggle
                          key={index}
                          enabled={true}
                          onChange={() => {}}
                          label={item.label}
                          description={item.description}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {activeTab === 'templates' && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Template Settings</h2>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Template
                  </label>
                  <Select
                    value={selectedTemplate}
                    onChange={(e) => setTemplate(e.target.value as any)}
                    options={templates.map(t => ({ value: t.id, label: t.name }))}
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    This template will be used by default when creating new notes.
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h3 className="font-medium text-gray-900 mb-4">Available Templates</h3>
                  <div className="grid gap-3">
                    {templates.map((template) => (
                      <motion.div
                        key={template.id}
                        whileHover={{ scale: 1.01 }}
                        className={`p-4 border rounded-xl cursor-pointer transition-all ${
                          selectedTemplate === template.id
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setTemplate(template.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">{template.name}</h4>
                            <p className="text-sm text-gray-500">{template.description}</p>
                          </div>
                          {selectedTemplate === template.id && (
                            <Check size={20} className="text-emerald-500" />
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {activeTab === 'security' && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Account & Security</h2>
                
                <div className="space-y-6">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">Change Password</h4>
                        <p className="text-sm text-gray-500">Update your account password</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Change
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">Two-Factor Authentication</h4>
                        <p className="text-sm text-gray-500">Add an extra layer of security</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Enable
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">Privacy Policy</h4>
                        <p className="text-sm text-gray-500">View our privacy policy</p>
                      </div>
                      <ChevronRight size={20} className="text-gray-400" />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="font-medium text-gray-900 mb-4">Danger Zone</h3>
                    <div className="p-4 border border-red-200 rounded-xl bg-red-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-red-700">Delete Account</h4>
                          <p className="text-sm text-red-600">Permanently delete your account and all data</p>
                        </div>
                        <Button className="bg-red-500 hover:bg-red-600" size="sm">
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </motion.div>
        </div>

        {/* Upgrade Modal */}
        <Modal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          title="Upgrade Your Plan"
          size="xl"
        >
          <div className="grid md:grid-cols-3 gap-4">
            {pricingPlans.map((plan) => (
              <div
                key={plan.id}
                className={`p-4 border rounded-xl ${
                  plan.highlighted ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'
                }`}
              >
                <h4 className="font-semibold text-gray-900">{plan.name}</h4>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {plan.price ? `$${plan.price}` : 'Custom'}
                  {plan.price && <span className="text-sm text-gray-500">/mo</span>}
                </p>
                <ul className="mt-4 space-y-2">
                  {plan.features.slice(0, 4).map((feature, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                      <Check size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button 
                  variant={plan.highlighted ? 'primary' : 'outline'}
                  className="w-full mt-4"
                  size="sm"
                  onClick={() => {
                    toast.success(`Redirecting to ${plan.name} checkout...`);
                    setShowUpgradeModal(false);
                  }}
                >
                  {plan.cta}
                </Button>
              </div>
            ))}
          </div>
        </Modal>
      </div>
    </Sidebar>
  );
}
