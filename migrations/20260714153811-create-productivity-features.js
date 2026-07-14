'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // 1. Alter documents table to add soft delete columns
      const tableInfo = await queryInterface.describeTable('documents');
      if (!tableInfo.deletedAt) {
        await queryInterface.addColumn('documents', 'deletedAt', {
          type: Sequelize.DATE,
          allowNull: true
        }, { transaction });
      }
      if (!tableInfo.deletedBy) {
        await queryInterface.addColumn('documents', 'deletedBy', {
          type: Sequelize.UUID,
          allowNull: true
        }, { transaction });
      }
      if (!tableInfo.deletedReason) {
        await queryInterface.addColumn('documents', 'deletedReason', {
          type: Sequelize.STRING(255),
          allowNull: true
        }, { transaction });
      }

      // 2. Create tags table
      const tables = await queryInterface.showAllTables();
      if (!tables.includes('tags')) {
        await queryInterface.createTable('tags', {
          id: {
            type: Sequelize.UUID,
            primaryKey: true,
            allowNull: false
          },
          name: {
            type: Sequelize.STRING(255),
            allowNull: false,
            unique: true
          },
          createdAt: {
            type: Sequelize.DATE,
            allowNull: false
          },
          updatedAt: {
            type: Sequelize.DATE,
            allowNull: false
          }
        }, { transaction });
      }

      // 3. Create favorite_documents table
      if (!tables.includes('favorite_documents')) {
        await queryInterface.createTable('favorite_documents', {
          id: {
            type: Sequelize.UUID,
            primaryKey: true,
            allowNull: false
          },
          userId: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: 'users',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
          },
          documentId: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: 'documents',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
          },
          createdAt: {
            type: Sequelize.DATE,
            allowNull: false
          },
          updatedAt: {
            type: Sequelize.DATE,
            allowNull: false
          }
        }, { transaction });

        await queryInterface.addIndex('favorite_documents', ['userId', 'documentId'], {
          unique: true,
          name: 'favorite_documents_user_document_unique_idx',
          transaction
        });
      }

      // 4. Create pinned_documents table
      if (!tables.includes('pinned_documents')) {
        await queryInterface.createTable('pinned_documents', {
          id: {
            type: Sequelize.UUID,
            primaryKey: true,
            allowNull: false
          },
          userId: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: 'users',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
          },
          documentId: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: 'documents',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
          },
          createdAt: {
            type: Sequelize.DATE,
            allowNull: false
          },
          updatedAt: {
            type: Sequelize.DATE,
            allowNull: false
          }
        }, { transaction });

        await queryInterface.addIndex('pinned_documents', ['userId', 'documentId'], {
          unique: true,
          name: 'pinned_documents_user_document_unique_idx',
          transaction
        });
      }

      // 5. Create document_tags table
      if (!tables.includes('document_tags')) {
        await queryInterface.createTable('document_tags', {
          id: {
            type: Sequelize.UUID,
            primaryKey: true,
            allowNull: false
          },
          documentId: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: 'documents',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
          },
          tagId: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: 'tags',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
          },
          createdAt: {
            type: Sequelize.DATE,
            allowNull: false
          },
          updatedAt: {
            type: Sequelize.DATE,
            allowNull: false
          }
        }, { transaction });

        await queryInterface.addIndex('document_tags', ['documentId', 'tagId'], {
          unique: true,
          name: 'document_tags_document_tag_unique_idx',
          transaction
        });
      }

      // 6. Create user_document_activity table
      if (!tables.includes('user_document_activity')) {
        await queryInterface.createTable('user_document_activity', {
          id: {
            type: Sequelize.UUID,
            primaryKey: true,
            allowNull: false
          },
          userId: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: 'users',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
          },
          documentId: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: 'documents',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
          },
          lastOpenedAt: {
            type: Sequelize.DATE,
            allowNull: true
          },
          lastEditedAt: {
            type: Sequelize.DATE,
            allowNull: true
          },
          lastViewedAt: {
            type: Sequelize.DATE,
            allowNull: true
          },
          createdAt: {
            type: Sequelize.DATE,
            allowNull: false
          },
          updatedAt: {
            type: Sequelize.DATE,
            allowNull: false
          }
        }, { transaction });

        await queryInterface.addIndex('user_document_activity', ['userId', 'documentId'], {
          unique: true,
          name: 'user_document_activity_user_document_unique_idx',
          transaction
        });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Drop new tables if they exist
      const tables = await queryInterface.showAllTables();
      if (tables.includes('user_document_activity')) {
        await queryInterface.dropTable('user_document_activity', { transaction });
      }
      if (tables.includes('document_tags')) {
        await queryInterface.dropTable('document_tags', { transaction });
      }
      if (tables.includes('pinned_documents')) {
        await queryInterface.dropTable('pinned_documents', { transaction });
      }
      if (tables.includes('favorite_documents')) {
        await queryInterface.dropTable('favorite_documents', { transaction });
      }
      if (tables.includes('tags')) {
        await queryInterface.dropTable('tags', { transaction });
      }

      // Remove added columns from documents if they exist
      const tableInfo = await queryInterface.describeTable('documents');
      if (tableInfo.deletedAt) {
        await queryInterface.removeColumn('documents', 'deletedAt', { transaction });
      }
      if (tableInfo.deletedBy) {
        await queryInterface.removeColumn('documents', 'deletedBy', { transaction });
      }
      if (tableInfo.deletedReason) {
        await queryInterface.removeColumn('documents', 'deletedReason', { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
