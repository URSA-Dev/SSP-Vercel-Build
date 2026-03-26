import SettingModel from '../models/setting.model.js';

/**
 * GET /api/v1/settings
 * Get all settings: tenant-level merged with user-level overrides.
 */
export async function getSettings(req, res, next) {
  try {
    const tenantSettings = await SettingModel.findAll('tenant', 'default');
    const userSettings = await SettingModel.findAll('user', req.user.id);

    // Build a map: tenant settings as base, user overrides on top
    const merged = {};

    for (const s of tenantSettings) {
      merged[s.key] = { value: s.value, scope: 'tenant' };
    }

    for (const s of userSettings) {
      merged[s.key] = { value: s.value, scope: 'user' };
    }

    res.json({ data: merged });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/settings/:key
 * Get a single setting. User scope takes priority over tenant scope.
 */
export async function getSetting(req, res, next) {
  try {
    const { key } = req.params;

    // Check user scope first
    const userSetting = await SettingModel.findByKey('user', req.user.id, key);

    if (userSetting) {
      return res.json({ key, value: userSetting.value, scope: 'user' });
    }

    // Fall back to tenant scope
    const tenantSetting = await SettingModel.findByKey('tenant', 'default', key);

    if (tenantSetting) {
      return res.json({ key, value: tenantSetting.value, scope: 'tenant' });
    }

    return res.status(404).json({
      error: { code: 'SETTING_NOT_FOUND', message: `Setting "${key}" not found` },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/v1/settings/:key
 * Upsert a setting value (JSONB). Defaults to user scope.
 */
export async function setSetting(req, res, next) {
  try {
    const { key } = req.params;
    const { value, scope } = req.body;

    if (value === undefined) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'value is required' },
      });
    }

    // Determine scope: user-level by default, tenant-level for admins
    const effectiveScope = scope === 'tenant' && req.user.role === 'admin'
      ? 'tenant'
      : 'user';

    const scopeId = effectiveScope === 'tenant' ? 'default' : req.user.id;

    const setting = await SettingModel.upsert(effectiveScope, scopeId, key, value);

    res.json(setting);
  } catch (err) {
    next(err);
  }
}

export default { getSettings, getSetting, setSetting };
