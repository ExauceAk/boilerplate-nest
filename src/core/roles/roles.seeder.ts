import { Injectable } from '@nestjs/common';
import { RolesRepository } from './roles.repository';
import { Roles } from './entities/roles.entity';

const roles = [
    {
        label: 'super_admin',
    },
    {
        label: 'admin',
    },
    {
        label: 'user',
    },
];

@Injectable()
export class RolesSeeder {
    constructor(private readonly repository: RolesRepository) {}

    /**
     * Seed all 'SysRole' records in the database.
     * @method seed
     * @async
     * @returns {Promise<void>} Returns a Promise that resolves when all 'SysRole' records have been created.
     */
    async seed(): Promise<void> {
        for (const role of roles) {
            const existingRole = await this.repository.findOne({
                where: { label: role.label },
            });
            if (!existingRole) {
                const data = new Roles(role);
                await this.repository.create(data);
            }
        }
    }
}
