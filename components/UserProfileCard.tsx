"use client";

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Phone, 
  Shield, 
  Calendar,
  Clock,
  Image as ImageIcon,
  Key,
  Lock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Crown,
  Settings
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getDisplayName, getUserAvatarUrl, hasEnhancedSecurity, getPrimaryContactInfo } from '@/utils/user-sync';

interface UserProfileData {
  user_id: string;
  clerk_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  username?: string;
  image_url?: string;
  has_image: boolean;
  primary_email_address_id?: string;
  primary_phone_number_id?: string;
  two_factor_enabled: boolean;
  backup_code_enabled: boolean;
  totp_enabled: boolean;
  external_id?: string;
  last_sign_in_at?: string;
  banned: boolean;
  locked: boolean;
  lockout_expires_in_seconds?: number;
  verification_attempts_remaining?: number;
  profile_image_url?: string;
  gender?: string;
  birthday?: string;
  public_metadata: any;
  private_metadata: any;
  unsafe_metadata: any;
  created_at: string;
  updated_at: string;
  plan_name: string;
  plan_price: number;
  subscription_status: string;
}

export default function UserProfileCard() {
  const { user } = useUser();
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const response = await fetch('/api/billing/user-profile');
        if (response.ok) {
          const data = await response.json();
          setProfileData(data.profile);
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfileData();
    }
  }, [user]);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-32"></div>
              <div className="h-3 bg-gray-200 rounded w-48"></div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (!profileData) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Profile data not available</p>
        </div>
      </Card>
    );
  }

  const displayName = getDisplayName(profileData);
  const avatarUrl = getUserAvatarUrl(profileData);
  const enhancedSecurity = hasEnhancedSecurity(profileData);
  const contactInfo = getPrimaryContactInfo(profileData);

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header with Avatar and Basic Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start space-x-4"
        >
          <div className="relative">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
            )}
            {profileData.has_image && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <ImageIcon className="w-3 h-3 text-white" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                {displayName}
              </h3>
              {enhancedSecurity && (
                <Shield className="w-4 h-4 text-green-600" />
              )}
              {profileData.banned && (
                <Badge variant="destructive" className="text-xs">Banned</Badge>
              )}
              {profileData.locked && (
                <Badge variant="secondary" className="text-xs">Locked</Badge>
              )}
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <Mail className="w-4 h-4" />
              <span className="truncate">{profileData.email}</span>
            </div>

            {profileData.username && (
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mt-1">
                <User className="w-4 h-4" />
                <span>@{profileData.username}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col items-end space-y-1">
            <Badge variant="outline" className="text-xs">
              {profileData.plan_name}
            </Badge>
            {profileData.plan_price > 0 && (
              <span className="text-xs text-gray-500">
                ${profileData.plan_price}/mo
              </span>
            )}
          </div>
        </motion.div>

        {/* Account Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {/* Contact Information */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
              <Mail className="w-4 h-4 mr-2" />
              Contact Information
            </h4>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Primary Email</span>
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              
              {profileData.primary_phone_number_id && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Phone Number</span>
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
              )}
            </div>
          </div>

          {/* Security Features */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
              <Shield className="w-4 h-4 mr-2" />
              Security Features
            </h4>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Two-Factor Auth</span>
                {profileData.two_factor_enabled ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-gray-400" />
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">TOTP Enabled</span>
                {profileData.totp_enabled ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-gray-400" />
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Backup Codes</span>
                {profileData.backup_code_enabled ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Account Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <h4 className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
            <Clock className="w-4 h-4 mr-2" />
            Account Activity
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400 block">Member Since</span>
              <span className="font-medium">
                {new Date(profileData.created_at).toLocaleDateString()}
              </span>
            </div>
            
            {profileData.last_sign_in_at && (
              <div>
                <span className="text-gray-600 dark:text-gray-400 block">Last Sign In</span>
                <span className="font-medium">
                  {new Date(profileData.last_sign_in_at).toLocaleDateString()}
                </span>
              </div>
            )}
            
            <div>
              <span className="text-gray-600 dark:text-gray-400 block">Account Status</span>
              <Badge 
                variant={profileData.subscription_status === 'active' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {profileData.subscription_status}
              </Badge>
            </div>
          </div>
        </motion.div>

        {/* Additional Information */}
        {(profileData.gender || profileData.birthday || Object.keys(profileData.public_metadata || {}).length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-3"
          >
            <h4 className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
              <Settings className="w-4 h-4 mr-2" />
              Additional Information
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {profileData.gender && (
                <div>
                  <span className="text-gray-600 dark:text-gray-400 block">Gender</span>
                  <span className="font-medium capitalize">{profileData.gender}</span>
                </div>
              )}
              
              {profileData.birthday && (
                <div>
                  <span className="text-gray-600 dark:text-gray-400 block">Birthday</span>
                  <span className="font-medium">{profileData.birthday}</span>
                </div>
              )}
            </div>

            {Object.keys(profileData.public_metadata || {}).length > 0 && (
              <div>
                <span className="text-gray-600 dark:text-gray-400 block text-xs mb-2">Public Metadata</span>
                <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto">
                  {JSON.stringify(profileData.public_metadata, null, 2)}
                </pre>
              </div>
            )}
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700"
        >
          <div className="text-xs text-gray-500">
            Profile synced from Clerk
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.location.reload()}
          >
            Refresh Profile
          </Button>
        </motion.div>
      </div>
    </Card>
  );
}
