"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Edit, Mail, Phone, MapPin, Calendar, Trophy, TrendingUp } from "lucide-react"
import { MobileSheet } from "@/components/mobile-sheet"

import type { UserProfile } from "@/lib/domain/types"
import { sanitizeAvatarUrl } from "@/lib/profile/avatar"
import { browserStorage, defaultProfile, loadWorkspace, notifyWorkspaceChanged, replaceWorkspace } from "@/lib/store/workspace"

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
  stats?: {
    tasksCompleted: number
    habitsTracked: number
  }
  onProfileChange?: (profile: UserProfile) => void
}

export function ProfileModal({ isOpen, onClose, stats, onProfileChange }: ProfileModalProps) {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile)

  const [isEditing, setIsEditing] = useState(false)
  const [editedProfile, setEditedProfile] = useState(profile)

  useEffect(() => {
    if (!isOpen) {
      return
    }
    const savedProfile = loadWorkspace(browserStorage()).profile
    setProfile(savedProfile)
    setEditedProfile(savedProfile)
  }, [isOpen])

  const handleSave = () => {
    const nextProfile = { ...editedProfile, name: editedProfile.name.trim() || "User", avatar: sanitizeAvatarUrl(editedProfile.avatar) }
    setProfile(nextProfile)
    setEditedProfile(nextProfile)
    const storage = browserStorage()
    const workspace = loadWorkspace(storage)
    replaceWorkspace(storage, { ...workspace, profile: nextProfile })
    onProfileChange?.(nextProfile)
    notifyWorkspaceChanged()
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditedProfile(profile)
    setIsEditing(false)
  }

  const handleAvatarChange = (value: string) => {
    setEditedProfile({ ...editedProfile, avatar: value })
  }

  const achievements = [
    { name: "Local-first", description: "Your workspace persists on this device", earned: true },
    { name: "Closer", description: "Complete a task", earned: (stats?.tasksCompleted ?? 0) > 0 },
    { name: "Habit starter", description: "Add a habit", earned: (stats?.habitsTracked ?? 0) > 0 },
  ]

  return (
    <MobileSheet
      open={isOpen}
      onClose={() => {
        handleCancel()
        onClose()
      }}
      title="Profile"
      footer={
        isEditing ? (
          <div className="mk-sheet-footer-actions">
            <Button variant="outline" className="mk-touch flex-1 rounded-xl bg-transparent" onClick={handleCancel}>
              Cancel
            </Button>
            <Button className="mk-touch flex-1 rounded-xl" onClick={handleSave}>
              Save changes
            </Button>
          </div>
        ) : (
          <div className="mk-sheet-footer-actions">
            <Button className="mk-touch w-full rounded-xl" onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit profile
            </Button>
          </div>
        )
      }
    >
          <div className="space-y-4 sm:space-y-6">
            <Card className="bg-card/95 backdrop-blur-xl border border-border/50 responsive-card text-center">
              <div className="relative inline-block mb-4">
                <Avatar className="w-16 h-16 sm:w-20 sm:h-20 mx-auto">
                  <AvatarImage src={isEditing ? editedProfile.avatar : profile.avatar} />
                  <AvatarFallback className="responsive-text-xl font-bold bg-primary/20 text-primary">
                    {(isEditing ? editedProfile.name : profile.name).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>

              {isEditing ? (
                <div className="space-y-3">
                  <div className="text-left">
                    <Label className="responsive-text-xs text-muted-readable">Avatar URL (https only)</Label>
                    <Input
                      type="url"
                      value={editedProfile.avatar}
                      onChange={(event) => handleAvatarChange(event.target.value)}
                      placeholder="https://example.com/me.png"
                      className="mt-1 bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl mobile-touch-target"
                    />
                  </div>
                  <Input
                    value={editedProfile.name}
                    onChange={(e) => setEditedProfile({ ...editedProfile, name: e.target.value })}
                    className="text-center font-bold responsive-text-lg bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl mobile-touch-target"
                    placeholder="Your name"
                  />
                  <Textarea
                    value={editedProfile.bio}
                    onChange={(e) => setEditedProfile({ ...editedProfile, bio: e.target.value })}
                    className="text-center responsive-text-sm resize-none bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl mobile-touch-target"
                    placeholder="Tell us about yourself..."
                    rows={2}
                  />
                </div>
              ) : (
                <div>
                  <h3 className="responsive-text-xl font-bold font-sans mb-2 text-readable">{profile.name}</h3>
                  <p className="responsive-text-sm text-muted-readable font-serif">{profile.bio}</p>
                </div>
              )}
            </Card>

            <Card className="bg-card/95 backdrop-blur-xl border border-border/50 responsive-card">
              <h4 className="font-semibold font-sans mb-3 flex items-center gap-2 text-readable">
                <Mail className="h-4 w-4" />
                Contact Information
              </h4>
              <div className="space-y-3">
                {isEditing ? (
                  <>
                    <div>
                      <Label className="responsive-text-xs text-muted-readable">Email</Label>
                      <Input
                        type="email"
                        value={editedProfile.email}
                        onChange={(e) => setEditedProfile({ ...editedProfile, email: e.target.value })}
                        className="mt-1 mobile-touch-target"
                      />
                    </div>
                    <div>
                      <Label className="responsive-text-xs text-muted-readable">Phone</Label>
                      <Input
                        type="tel"
                        value={editedProfile.phone}
                        onChange={(e) => setEditedProfile({ ...editedProfile, phone: e.target.value })}
                        className="mt-1 mobile-touch-target"
                      />
                    </div>
                    <div>
                      <Label className="responsive-text-xs text-muted-readable">Location</Label>
                      <Input
                        value={editedProfile.location}
                        onChange={(e) => setEditedProfile({ ...editedProfile, location: e.target.value })}
                        className="mt-1 mobile-touch-target"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3 responsive-text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-readable break-all">{profile.email}</span>
                    </div>
                    <div className="flex items-center gap-3 responsive-text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-readable">{profile.phone}</span>
                    </div>
                    <div className="flex items-center gap-3 responsive-text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-readable">{profile.location}</span>
                    </div>
                    <div className="flex items-center gap-3 responsive-text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-readable">Joined {profile.joinDate}</span>
                    </div>
                  </>
                )}
              </div>
            </Card>

            <Card className="bg-card/95 backdrop-blur-xl border border-border/50 responsive-card">
              <h4 className="font-semibold font-sans mb-3 flex items-center gap-2 text-readable">
                <TrendingUp className="h-4 w-4" />
                Your Manage.kar Stats
              </h4>
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                <div className="text-center">
                  <div className="responsive-text-lg font-bold font-sans text-primary">
                    {stats?.tasksCompleted ?? 0}
                  </div>
                  <div className="responsive-text-xs text-muted-readable font-serif">Done</div>
                </div>
                <div className="text-center">
                  <div className="responsive-text-lg font-bold font-sans text-blue-500">{stats?.habitsTracked ?? 0}</div>
                  <div className="responsive-text-xs text-muted-readable font-serif">Habits</div>
                </div>
                <div className="text-center">
                  <div className="responsive-text-lg font-bold font-sans text-green-500">Local</div>
                  <div className="responsive-text-xs text-muted-readable font-serif">Workspace</div>
                </div>
              </div>
            </Card>

            <Card className="bg-card/95 backdrop-blur-xl border border-border/50 responsive-card">
              <h4 className="font-semibold font-sans mb-3 flex items-center gap-2 text-readable">
                <Trophy className="h-4 w-4" />
                Achievements
              </h4>
              <div className="space-y-2">
                {achievements.filter((achievement) => achievement.earned).length === 0 ? (
                  <p className="text-sm text-muted-readable">No earned facts yet.</p>
                ) : null}
                {achievements.filter((achievement) => achievement.earned).map((achievement, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between gap-3 p-3 rounded-xl transition-colors ${
                      achievement.earned ? "bg-primary/10" : "bg-muted/20"
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${achievement.earned ? "bg-primary" : "bg-muted"}`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="responsive-text-sm font-medium font-sans text-readable truncate">
                          {achievement.name}
                        </div>
                        <div className="responsive-text-xs text-muted-readable font-serif line-clamp-2">
                          {achievement.description}
                        </div>
                      </div>
                    </div>
                    {achievement.earned && (
                      <Badge variant="secondary" className="responsive-text-xs flex-shrink-0">
                        Earned
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </Card>

          </div>
    </MobileSheet>
  )
}
