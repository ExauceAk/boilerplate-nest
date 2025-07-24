import {
    ApiBearerAuth,
    ApiOperation,
    ApiParam,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Request,
    UseGuards,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { Roles } from './entities/roles.entity';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import { CreateRole } from './dtos/create_role.dto';
import { UpdateRoleDto } from './dtos/update_role.dto';

/**
 * Controller responsible for managing roles
 */
@ApiTags('roles')
@Controller('roles')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
export class RolesController {
    constructor(private readonly rolesService: RolesService) {}

    /**
     * Find all roles
     * @returns {Promise<Roles[]>} - The list of roles
     */
    @Get()
    @ApiOperation({
        summary: 'Find all roles',
        description: 'Retrieve a list of all available roles.',
    })
    @ApiResponse({
        status: 200,
        description: 'Roles found and returned successfully.',
        type: [Roles],
    })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async findAll(): Promise<Roles[]> {
        return await this.rolesService.findAllRoles();
    }

    /**
     * Find a role by id
     * @param {string} id - The id of the role
     * @param req - The request object
     * @returns {Promise<Roles>} - The role
     */
    @Get(':id')
    @ApiOperation({
        summary: 'Find a role by id',
        description: 'Retrieve a specific role by its id.',
    })
    @ApiParam({
        name: 'id',
        description: 'Id of the role to be retrieved',
        example: '1',
    })
    @ApiResponse({
        status: 200,
        description: 'Role found and returned successfully.',
        type: Roles,
    })
    @ApiResponse({ status: 404, description: 'Role not found.' })
    @ApiResponse({ status: 400, description: 'Invalid UUID format.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async findOne(
        @Request() req: any,
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<Roles> {
        return await this.rolesService.findRoleById(req.user.id, id);
    }

    /**
     * Find a role by label
     * @param {string} label - The label of the role
     * @param req - The request object
     * @returns {Promise<Roles>} - The role
     */
    @Get('findBy/:label')
    @ApiOperation({
        summary: 'Find a role by label',
        description: 'Retrieve a specific role by its label.',
    })
    @ApiParam({
        name: 'label',
        description: 'Label of the role to be retrieved',
        example: 'Admin',
    })
    @ApiResponse({
        status: 200,
        description: 'Role found and returned successfully.',
        type: Roles,
    })
    @ApiResponse({ status: 404, description: 'Role not found.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async findByLabel(
        @Request() req: any,
        @Param('label') label: string,
    ): Promise<Roles> {
        return await this.rolesService.findRoleByLabel(req.user.id, label);
    }

    /**
     * Create a role
     * @returns {Promise<Roles>} - The created role
     */
    @Post()
    @ApiOperation({
        summary: 'Create a new role',
        description: 'Create a new record of role',
    })
    @ApiResponse({
        status: 201,
        description: 'Role created successfully.',
        type: Roles,
    })
    @ApiResponse({ status: 409, description: 'Role already exist.' })
    @ApiResponse({ status: 400, description: 'Bad request.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async create(
        @Request() req: any,
        @Body() createAppRole: CreateRole,
    ): Promise<Partial<Roles>> {
        return await this.rolesService.createRole(req.user.id, createAppRole);
    }

    /**
     * Update a role
     * @param {string} id - The id of the role
     * @param {Roles} updateRole - The data of the role
     * @param req - The request object
     * @returns {Promise<Roles>} - The updated role
     */
    @Patch('update/:id')
    @ApiParam({ name: 'id', description: 'Id of the role to be updated' })
    @ApiOperation({
        summary: 'Update a role',
        description: 'Update an existing role',
    })
    @ApiResponse({
        status: 200,
        description: 'Role updated successfully.',
        type: Roles,
    })
    @ApiResponse({ status: 404, description: 'Role not found.' })
    @ApiResponse({ status: 409, description: 'Role name already exist.' })
    @ApiResponse({ status: 400, description: 'Invalid UUID format.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async update(
        @Request() req: any,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateRole: UpdateRoleDto,
    ): Promise<Partial<Roles>> {
        return await this.rolesService.updateRole(req.user.id, id, updateRole);
    }

    /**
     * Delete a role
     * @param {string} id - The id of the role
     * @param req - The request object
     * @returns {Promise<string>} - The message of the deleted role
     */
    @Delete('delete/:id')
    @ApiParam({
        name: 'id',
        description: 'Id of the role to be deleted',
        example: '1a97702b-bed5-4219-a050-16b2423725f3',
    })
    @ApiOperation({
        summary: 'Delete a role',
        description: 'Delete an existing role',
    })
    @ApiResponse({
        status: 200,
        description: 'Role deleted successfully.',
        type: String,
    })
    @ApiResponse({ status: 404, description: 'Role not found.' })
    @ApiResponse({ status: 400, description: 'Invalid UUID format.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async delete(
        @Request() req: any,
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<object> {
        return await this.rolesService.deleteRole(req.user.id, id);
    }
}
