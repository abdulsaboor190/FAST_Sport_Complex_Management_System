import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { config } from '../config.js';

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function makeImageStorage(dir: string) {
  ensureDir(dir);
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || '.jpg';
      const safeExt = ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext.toLowerCase())
        ? ext.toLowerCase()
        : '.jpg';
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${safeExt}`);
    },
  });
}

const avatarsDir = path.resolve(config.uploadDir, 'avatars');
const teamsDir = path.resolve(config.uploadDir, 'teams');
const tournamentsDir = path.resolve(config.uploadDir, 'tournaments');

export const uploadAvatar = multer({
  storage: makeImageStorage(avatarsDir),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = /^image\/(jpeg|png|gif|webp)$/i.test(file.mimetype);
    cb(null, allowed);
  },
});

export function getAvatarUrl(relativePath: string): string {
  if (relativePath.startsWith('http')) return relativePath;
  return `/uploads/avatars/${path.basename(relativePath)}`;
}

export const uploadTeamLogo = multer({
  storage: makeImageStorage(teamsDir),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /^image\/(jpeg|png|gif|webp)$/i.test(file.mimetype);
    cb(null, allowed);
  },
});

export function getTeamLogoUrl(fileName: string): string {
  if (fileName.startsWith('http')) return fileName;
  return `/uploads/teams/${path.basename(fileName)}`;
}

export const uploadTournamentPoster = multer({
  storage: makeImageStorage(tournamentsDir),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /^image\/(jpeg|png|gif|webp)$/i.test(file.mimetype);
    cb(null, allowed);
  },
});

export function getTournamentPosterUrl(fileName: string): string {
  if (fileName.startsWith('http')) return fileName;
  return `/uploads/tournaments/${path.basename(fileName)}`;
}

const equipmentDir = path.resolve(config.uploadDir, 'equipment');
export const uploadEquipmentPhoto = multer({
  storage: makeImageStorage(equipmentDir),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /^image\/(jpeg|png|gif|webp)$/i.test(file.mimetype);
    cb(null, allowed);
  },
});

export function getEquipmentPhotoUrl(fileName: string): string {
  if (fileName.startsWith('http')) return fileName;
  return `/uploads/equipment/${path.basename(fileName)}`;
}

const eventsDir = path.resolve(config.uploadDir, 'events');
export const uploadEventBanner = multer({
  storage: makeImageStorage(eventsDir),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /^image\/(jpeg|png|gif|webp)$/i.test(file.mimetype);
    cb(null, allowed);
  },
});

export function getEventBannerUrl(fileName: string): string {
  if (fileName.startsWith('http')) return fileName;
  return `/uploads/events/${path.basename(fileName)}`;
}

const issuesDir = path.resolve(config.uploadDir, 'issues');
export const uploadIssueMedia = multer({
  storage: makeImageStorage(issuesDir),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedImage = /^image\/(jpeg|png|gif|webp)$/i.test(file.mimetype);
    const allowedVideo = /^video\//i.test(file.mimetype);
    cb(null, allowedImage || allowedVideo);
  },
});
