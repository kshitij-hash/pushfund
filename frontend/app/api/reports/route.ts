/**
 * Campaign Report API Route
 * Handles submission and storage of campaign reports
 */

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const REPORTS_DIR = path.join(process.cwd(), 'data', 'reports');
const REPORTS_FILE = path.join(REPORTS_DIR, 'reports.json');

interface Report {
  id: string;
  campaignAddress: string;
  campaignTitle: string;
  reason: string;
  details: string;
  timestamp: number;
  reporterIp?: string;
  status: 'pending' | 'reviewed' | 'resolved';
}

interface ReportData {
  reports: Report[];
}

/**
 * Ensure reports directory and file exist
 */
async function ensureReportsFile(): Promise<ReportData> {
  try {
    // Create data directory if it doesn't exist
    if (!existsSync(REPORTS_DIR)) {
      await mkdir(REPORTS_DIR, { recursive: true });
    }

    // Create reports file if it doesn't exist
    if (!existsSync(REPORTS_FILE)) {
      const initialData: ReportData = { reports: [] };
      await writeFile(REPORTS_FILE, JSON.stringify(initialData, null, 2));
      return initialData;
    }

    // Read existing reports
    const fileContent = await readFile(REPORTS_FILE, 'utf-8');
    return JSON.parse(fileContent) as ReportData;
  } catch (error) {
    console.error('Error ensuring reports file:', error);
    return { reports: [] };
  }
}

/**
 * Save reports to file
 */
async function saveReports(data: ReportData): Promise<void> {
  await writeFile(REPORTS_FILE, JSON.stringify(data, null, 2));
}

/**
 * Rate limiting check (simple IP-based)
 */
function checkRateLimit(
  reports: Report[],
  reporterIp: string | null,
  timeWindowMs: number = 3600000 // 1 hour
): boolean {
  if (!reporterIp) return true; // Allow if IP not available

  const recentReports = reports.filter(
    (r) =>
      r.reporterIp === reporterIp &&
      Date.now() - r.timestamp < timeWindowMs
  );

  // Allow max 3 reports per hour per IP
  return recentReports.length < 3;
}

/**
 * POST /api/reports
 * Submit a new campaign report
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.campaignAddress || !body.reason || !body.details) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate details length
    if (body.details.trim().length < 20) {
      return NextResponse.json(
        { error: 'Details must be at least 20 characters' },
        { status: 400 }
      );
    }

    // Get reporter IP for rate limiting
    const reporterIp = request.headers.get('x-forwarded-for') ||
                      request.headers.get('x-real-ip') ||
                      null;

    // Load existing reports
    const data = await ensureReportsFile();

    // Check rate limit
    if (!checkRateLimit(data.reports, reporterIp)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Create new report
    const newReport: Report = {
      id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      campaignAddress: body.campaignAddress,
      campaignTitle: body.campaignTitle || 'Unknown Campaign',
      reason: body.reason,
      details: body.details.trim(),
      timestamp: body.timestamp || Date.now(),
      reporterIp: reporterIp || undefined,
      status: 'pending',
    };

    // Add report to data
    data.reports.push(newReport);

    // Save to file
    await saveReports(data);

    console.log(`New report submitted for campaign: ${body.campaignAddress}`);

    return NextResponse.json(
      {
        success: true,
        message: 'Report submitted successfully',
        reportId: newReport.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error handling report submission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/reports
 * Get all reports (admin only - basic implementation)
 */
export async function GET(request: NextRequest) {
  try {
    // Simple admin check via query parameter (should use proper auth in production)
    const adminKey = request.nextUrl.searchParams.get('admin_key');

    if (adminKey !== process.env.ADMIN_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await ensureReportsFile();

    return NextResponse.json({
      success: true,
      reports: data.reports,
      count: data.reports.length,
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
