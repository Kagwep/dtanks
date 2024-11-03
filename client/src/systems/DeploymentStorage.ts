import { DeploymentParams } from "@/types";

export class DeploymentStorage {
    private readonly STORAGE_KEY = 'dtank_deployments';

    // Get all deployments
    public getAllDeployments(): DeploymentParams[] {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (!stored) return [];
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error('Error parsing deployments:', e);
            return [];
        }
    }

    // Add new deployment
    public addDeployment(params: Omit<DeploymentParams, 'timestamp'>): void {
        const deployments = this.getAllDeployments();
        
        const newDeployment: DeploymentParams = {
            ...params,
            timestamp: Date.now()
        };

        deployments.push(newDeployment);
        
        // Keep only last 50 deployments (or adjust limit as needed)
        if (deployments.length > 50) {
            deployments.shift(); // Remove oldest
        }

        this.saveDeployments(deployments);
    }

    // Get deployment by unit ID
    public getDeploymentByUnitId(unitId: number): DeploymentParams | undefined {
        const deployments = this.getAllDeployments();
        return deployments.find(d => d.unitId === unitId);
    }

    // Get latest deployments (with limit)
    public getLatestDeployments(limit: number = 10): DeploymentParams[] {
        const deployments = this.getAllDeployments();
        return deployments
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);
    }

    // Clear all deployments
    public clearDeployments(): void {
        localStorage.removeItem(this.STORAGE_KEY);
    }

    // Private helper to save deployments
    private saveDeployments(deployments: DeploymentParams[]): void {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(deployments));
        } catch (e) {
            console.error('Error saving deployments:', e);
            // Handle storage quota exceeded
            if (e instanceof Error && e.name === 'QuotaExceededError') {
                // Remove oldest entries until it fits
                while (deployments.length > 0) {
                    deployments.shift();
                    try {
                        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(deployments));
                        break;
                    } catch (e) {
                        continue;
                    }
                }
            }
        }
    }
}

