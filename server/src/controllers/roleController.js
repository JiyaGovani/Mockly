import Role from '../models/Role.js';

/**
 * GET /api/roles
 * Return all active roles.
 */
export const getRoles = async (req, res) => {
  try {
    const roles = await Role.find({ isActive: true })
      .select('name displayName description')
      .sort('name');

    res.json({ roles });
  } catch (err) {
    console.error('getRoles error:', err);
    res.status(500).json({ message: 'Server error fetching roles' });
  }
};
