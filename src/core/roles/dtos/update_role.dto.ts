import { PartialType } from '@nestjs/swagger';
import { CreateRole } from './create_role.dto';

export class UpdateRoleDto extends PartialType(CreateRole) {}
