import { app, BrowserWindow, ipcMain, shell } from 'electron';
import * as path from 'path';
import { spawn, ChildProcess } from 'child_process';
import ApiService from './api/ApiService';

const isDev = process.env.ELECTRON_DEV === 'true';

class FacilityBookingApp {
    private mainWindow: BrowserWindow | null = null;
    private apiService: ApiService;
    private nextProcess: ChildProcess | null = null;
    
    constructor() {
        this.apiService = new ApiService();
        
        // Fix GPU issues on Windows
        app.commandLine.appendSwitch('--disable-gpu-sandbox');
        app.commandLine.appendSwitch('--disable-software-rasterizer');
        app.commandLine.appendSwitch('--disable-gpu');
        app.commandLine.appendSwitch('--no-sandbox');
        
        this.setupEventHandlers();
    }

    private setupEventHandlers(): void {
        app.whenReady().then(async () => {
            if (isDev) {
                // In development, Next.js server should already be running
                console.log('Development mode: using existing Next.js server');
                // Wait a bit for the server to be fully ready
                await new Promise(resolve => setTimeout(resolve, 2000));
                await this.createWindow();
            } else {
                // In production, start Next.js server
                console.log('Production mode: starting Next.js server');
                await this.startNextServer();
                await this.createWindow();
            }
            
            app.on('activate', () => {
                if (BrowserWindow.getAllWindows().length === 0) {
                    this.createWindow();
                }
            });
        });

        app.on('window-all-closed', () => {
            if (this.nextProcess) {
                this.nextProcess.kill();
            }
            if (process.platform !== 'darwin') {
                app.quit();
            }
        });

        app.on('before-quit', () => {
            if (this.nextProcess) {
                this.nextProcess.kill();
            }
        });

        // IPC handlers for API calls
        ipcMain.handle('get-facilities', async () => {
            return await this.apiService.getAllFacilities();
        });

        ipcMain.handle('get-facility-availability', async (event, facilityId: string, date: string) => {
            return await this.apiService.getFacilityAvailability(facilityId, date);
        });

        ipcMain.handle('get-facility-weekly-availability', async (event, facilityId: string, startDate: string, endDate: string) => {
            return await this.apiService.getFacilityWeeklyAvailability(facilityId, startDate, endDate);
        });

        ipcMain.handle('get-facilities-by-center', async (event, centerName: string) => {
            return await this.apiService.getFacilitiesByCenter(centerName);
        });

        ipcMain.handle('refresh-cookies', async () => {
            return await this.apiService.refreshCookies();
        });

        ipcMain.handle('get-unique-centers', async () => {
            return await this.apiService.getUniqueCenters();
        });

        ipcMain.handle('open-external', async (event, url: string) => {
            await shell.openExternal(url);
        });
    }

    private async startNextServer(): Promise<void> {
        return new Promise((resolve, reject) => {
            // Use npm.cmd on Windows
            const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
            this.nextProcess = spawn(npmCommand, ['run', 'nextstart'], {
                cwd: __dirname,
                stdio: 'pipe',
                shell: true
            });

            let serverReady = false;

            this.nextProcess.stdout?.on('data', (data) => {
                const output = data.toString();
                console.log('Next.js:', output);
                if (output.includes('ready') || output.includes('started server')) {
                    if (!serverReady) {
                        serverReady = true;
                        setTimeout(resolve, 1000); // Give it a moment to fully start
                    }
                }
            });

            this.nextProcess.stderr?.on('data', (data) => {
                console.error('Next.js Error:', data.toString());
            });

            this.nextProcess.on('error', (error) => {
                console.error('Failed to start Next.js server:', error);
                reject(error);
            });

            // Fallback timeout
            setTimeout(() => {
                if (!serverReady) {
                    console.log('Next.js server timeout, proceeding anyway...');
                    resolve();
                }
            }, 10000);
        });
    }

    private async createWindow(): Promise<void> {
        this.mainWindow = new BrowserWindow({
            width: 1200,
            height: 800,
            minWidth: 800,
            minHeight: 600,
            icon: isDev ? path.join(__dirname, 'public/icons/icon.svg') : path.join(process.resourcesPath, 'app/public/icons/icon.svg'),
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, 'dist/preload.js'),
                webSecurity: false, // Allow loading local resources
                allowRunningInsecureContent: false
            },
            show: false,
            // Fix white screen issues
            backgroundColor: '#ffffff',
            titleBarStyle: 'default',
            autoHideMenuBar: true
        });

        const url = isDev ? 'http://localhost:3001' : 'http://localhost:3000';
        console.log(`Loading URL: ${url}`);
        
        try {
            await this.mainWindow.loadURL(url);
            console.log(`Successfully loaded URL: ${url}`);
        } catch (error) {
            console.error('Failed to load URL:', error);
            // Fallback to a simple error page
            console.log('Loading fallback HTML file');
            this.mainWindow.loadFile(path.join(__dirname, 'fallback.html'));
        }

        // Ensure external links open in default browser, not new Electron windows
        this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
            shell.openExternal(url);
            return { action: 'deny' };
        });

        // Also handle navigation attempts to external URLs
        this.mainWindow.webContents.on('will-navigate', (event, url) => {
            // Allow navigation within the app (localhost)
            if (url.startsWith('http://localhost:3001') || url.startsWith('http://localhost:3000')) {
                return;
            }
            
            // For any other URLs, prevent navigation and open in external browser
            event.preventDefault();
            shell.openExternal(url);
        });

        // Show window when ready to prevent visual flash
        this.mainWindow.once('ready-to-show', () => {
            console.log('Window ready-to-show event fired');
            this.mainWindow?.show();
            this.mainWindow?.focus();
        });

        // Force show window after 3 seconds if not already shown
        setTimeout(() => {
            if (this.mainWindow && !this.mainWindow.isVisible()) {
                console.log('Force showing window after timeout');
                this.mainWindow.show();
                this.mainWindow.focus();
            }
        }, 3000);

        // Development tools and debugging
        if (isDev) {
            this.mainWindow.webContents.openDevTools();
        }
        
        // Add error handling for the web contents
        this.mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
            console.error('Failed to load URL:', validatedURL, 'Error:', errorDescription);
        });
        
        this.mainWindow.webContents.on('crashed', () => {
            console.error('Web contents crashed');
        });
    }
}

// Initialize the app
new FacilityBookingApp();