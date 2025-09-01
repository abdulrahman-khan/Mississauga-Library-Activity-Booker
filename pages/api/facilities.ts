import fs from 'fs';
import path from 'path';
import { NextApiRequest, NextApiResponse } from 'next';
import { Facility } from '../../types';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const facilitiesPath = path.join(process.cwd(), 'data', 'all_facilities.json');
    const facilitiesData = fs.readFileSync(facilitiesPath, 'utf-8');
    const facilitiesJson: Facility[] = JSON.parse(facilitiesData);
    
    res.status(200).json(facilitiesJson);
  } catch (error) {
    console.error('Error loading facilities:', error);
    res.status(500).json({ error: 'Failed to load facilities' });
  }
}