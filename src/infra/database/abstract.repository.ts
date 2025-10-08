import {
  EntityManager,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  In,
  Repository,
} from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { AbstractEntity } from './abstract.entity';

export abstract class AbstractRepository<T extends AbstractEntity<T>> {
  protected constructor(
    private readonly entityRepository: Repository<T>,
    protected readonly entityManager: EntityManager,
  ) {}

  /**
   * Counts the number of entities that match the provided conditions.
   *
   * @returns {Promise<number>} - A promise that resolves to the count of entities.
   * @param options
   */
  async count(options: FindManyOptions<T>): Promise<number> {
    return this.entityRepository.count(options);
  }

  /**
   * Finds entities in the database that matches the provided conditions.
   *
   * @returns {Promise<[]>} - A promise that resolves to an array of found entities.
   * @param options
   */
  async find(options: FindManyOptions<T>): Promise<T[]> {
    return this.entityRepository.find(options);
  }

  /**
   * Finds entities in the database that matches the provided conditions and returns the total count.
   *
   * @returns {Promise<[[], number]>} - A promise that resolves to an array containing the found entities and the total count.
   * @param options
   */
  async findAndCount(options: FindManyOptions<T>): Promise<[T[], number]> {
    return this.entityRepository.findAndCount(options);
  }

  /**
   * Finds a single entities in/home/ketou/Documents/Office//src/core/roles the database that matches the provided conditions.
   * Throws a NotFoundException if no entities are found.
   *
   * @returns {Promise} - A promise that resolves to the found entities.
   * @param options
   */
  async findOne(options: FindOneOptions<T>): Promise<T | null> {
    return await this.entityRepository.findOne(options);
  }

  /**
   * Creates a new entities in the database.
   *
   * @param entity - The entities to be created.
   * @returns {Promise} - A promise that resolves to the created entities.
   */
  async create(entity: T): Promise<T> {
    return this.entityManager.save(entity);
  }

  /**
   * Saves an entities in the database.
   *
   * @returns {Promise} - A promise that resolves to the saved entities.
   * @param entity
   */
  async save(entity: T): Promise<T> {
    return this.entityManager.save(entity);
  }

  /**
   * Creates multiple entities in the database.
   *
   * @param entities - The array of entities to be created.
   * @returns {Promise<entities[]>} - A promise that resolves to the created entities.
   */
  async createMany(entities: T[]): Promise<T[]> {
    return await this.entityManager.save(entities);
  }

  /**
   * Updates an entities in the database that matches the provided conditions.
   * Throws a NotFoundException if no entities are found to update.
   *
   * @param {FindOptionsWhere} where - The conditions to match.
   * @param {QueryDeepPartialEntity} partialEntity - The new values for the entities.
   * @returns {Promise} - A promise that resolves to the updated entities.
   */
  async update(
    where: FindOptionsWhere<T>,
    partialEntity: QueryDeepPartialEntity<T>,
  ): Promise<any> {
    await this.entityRepository.update(where, partialEntity);
    return this.findOne({ where });
  }

  /**
   * Deletes an entities in the database that matches the provided conditions.
   *
   * @param {FindOptionsWhere} where - The conditions to match.
   * @param message
   * @returns {Promise<void>} - A promise that resolves when the deletion is complete.
   */
  async delete(
    where: FindOptionsWhere<T>,
    message?: string | null,
  ): Promise<string | null | undefined> {
    await this.entityRepository.delete(where);
    return message ?? message;
  }

  /**
   * Soft-delete an entities in the database that matches the provided conditions
   * @param {FindOptionsWhere} where - The conditions to match.
   * @param message
   * @returns {Promise<void>} - A promise that resolves when the deletion is complete.
   */
  async softDelete(
    where: FindOptionsWhere<T>,
    message?: string | null,
  ): Promise<string | null | undefined> {
    await this.entityRepository.softDelete(where);
    await this.entityRepository.update(where, {
      deleted: true,
    } as unknown as QueryDeepPartialEntity<T>);
    return message ?? message;
  }

  /**
   * Restore an entities in the database that matches the provided conditions
   * @param {FindOptionsWhere} where - The conditions to match.
   * @param message
   * @returns {Promise<void>} - A promise that resolves when the deletion is complete.
   */
  async restore(
    where: FindOptionsWhere<T>,
    message?: string | null,
  ): Promise<string | null | undefined> {
    await this.entityRepository.restore(where);
    await this.entityRepository.update(where, {
      deleted: false,
    } as unknown as QueryDeepPartialEntity<T>);
    return message ?? message;
  }

  /**
   * Retrieves an entity from the repository based on the given criteria and optional relations.
   * Throws a NotFoundException if the entity does not exist.
   */
  async retrieveEntity(
    repository: any,
    criteria: { key: string; value: string },
    relations?: string[],
  ): Promise<any> {
    return await repository.findOne({
      where: { [criteria.key]: criteria.value.trim(), deleted: false },
      relations: relations,
    });
  }

  /**
   * Retrieves multiple entities from the repository based on the given criteria and optional relations.
   * Throws a not found error if some entities are missing.
   */
  async retrieveEntities(
    repository: any,
    criteria: { key: string; values: string[] },
    relations?: string[],
  ): Promise<any> {
    const filterValues = [...new Set(criteria.values)];

    return await repository.find({
      where: {
        [criteria.key]: In(filterValues),
        deleted: false,
      },
      relations: relations,
    });
  }
}
