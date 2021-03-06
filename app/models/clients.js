

// Libraries
const db = require('../../app/db');
const Promise = require('bluebird');

const Conversations = require('./conversations');
const CommConns = require('./commConns');
const Departments = require('./departments');
const Users = require('./users');

const colors = require('colors');

const BaseModel = require('../lib/models').BaseModel;

class Clients extends BaseModel {

  constructor(data) {
    super({
      data,
      columns: [
        'clid',
        'cm',
        'first',
        'middle',
        'last',
        'dob',
        'otn',
        'so',
        'active',
        'color_tag',
        'updated',
        'created',
        'allow_automated_notifications',
      ],
    });
  }

  communications() {
    const Communications = require('./communications');
    return new Promise((fulfill, reject) => {
      CommConns.findByClientIdWithCommMetaData(this.clid)
      .then((commconns) => {
        const commids = commconns.map(commconn => commconn.commconnid);
        return Communications.findByIds(commids);
      }).then(fulfill).catch(reject);
    });
  }

  static alterCase(clientID, active) {
    if (typeof active === 'undefined') active = true;

    return new Promise((fulfill, reject) => {
      db('clients')
        .update({ active })
        .where('clid', clientID)
      .then(() => {
        fulfill();
      }).catch(reject);
    });
  }

  static create(userId, first, middle, last, dob, otn, so) {
    return new Promise((fulfill, reject) => {
      db('clients')
        .insert({
          cm: userId,
          first,
          middle,
          last,
          dob,
          otn,
          so,
          active: true,
          allow_automated_notifications: true,
        })
        .returning('*')
      .then((clients) => {
        this._getSingleResponse(clients, fulfill);
      }).catch(reject);
    });
  }

  static editOne(clientId, first, middle, last, dob, uniqueID1, uniqueID2, autoNotify) {
    return new Promise((fulfill, reject) => {
      db('clients')
        .update({
          first,
          middle,
          last,
          dob,
          so: uniqueID1,
          otn: uniqueID2,
          allow_automated_notifications: autoNotify,
        })
        .where('clid', clientId)
      .then(() => {
        fulfill();
      }).catch(reject);
    });
  }

  static findAllByUsers(userIds) {
    if (!Array.isArray(userIds)) userIds = [userIds,];
    return new Promise((fulfill, reject) => {
      let clientsOpen;
      Clients.findByUsers(userIds, true)
      .then((clients) => {
        clientsOpen = clients;
        return Clients.findByUsers(userIds, false);
      }).then(clientsClosed => fulfill(clientsOpen.concat(clientsClosed))).catch(reject);
    });
  }

  static findByCommId(commId) {
    return new Promise((fulfill, reject) => {
      db('clients')
        .leftJoin(
          db('commconns')
            .whereNull('retired')
            .as('commconns'),
          'commconns.client', 'clients.clid')
        .where('comm', commId)
      .then((clients) => {
        this._getMultiResponse(clients, fulfill);
      }).catch(reject);
    });
  }

  static findManyByDepartmentAndStatus(departmentId, status) {
    if (typeof status === 'undefined') status = true;

    return new Promise((fulfill, reject) => {
      Users.findManyByAttribute('department_id', departmentId)
      .then((users) => {
        const userIds = users.map(user => user.cmid);
        return Clients.findByUsers(userIds, status);
      }).then((clients) => {
        this._getMultiResponse(clients, fulfill);
      }).catch(reject);
    });
  }

  static findByID(clientId) {
    return new Promise((fulfill, reject) => {
      let finalClientsObject;
      db('clients')
        .select('clients.*',
                'cms.cmid as user_id',
                'departments.name as department_name',
                'cms.first as user_first',
                'cms.middle as user_middle',
                'cms.last as user_last',
                'cms.department as department',
                'color_tags.color as color_tag',
                'color_tags.name as color_name')

        .leftJoin('cms', 'clients.cm', 'cms.cmid')
        .leftJoin('departments', 'cms.department', 'departments.department_id')
        .leftJoin(
          db('color_tags')
            .where('active', true)
            .as('color_tags'),
          'color_tags.color_tag_id', 'clients.color_tag')

        // Only where active T/F and case manager matches
        .where('clients.clid', clientId)
        .limit(1)

      .then((clients) => {
        // Need to make sure there is a default color_tag color
        finalClientsObject = clients.map((client) => {
          if (!client.color_tag) client.color_tag = '#898989';
          if (!client.color_tag) client.color_name = 'None';
          return client;
        });

        const clientIds = finalClientsObject.map(client => client.clid);

        return CommConns.findByClientIdsWithCommMetaData(clientIds);
      }).then((commConns) => {
        finalClientsObject = finalClientsObject.map((client) => {
          client.communications = [];
          commConns.forEach((commconn) => {
            if (client.clid == commconn.client) {
              client.communications.push(commconn);
            }
          });
          return client;
        });

        finalClientsObject = finalClientsObject[0];

        return Departments.findByMember(finalClientsObject.cm);
      }).then((department) => {
        if (finalClientsObject) {
          if (department) {
            finalClientsObject.department = department;
          } else {
            finalClientsObject.department = {};
          }
        } else {
          finalClientsObject = {};
        }
        fulfill(finalClientsObject);
      }).catch(reject);
    });
  }

  static findByOrg(orgId, status) {
    if (typeof status === 'undefined') status = true;

    return new Promise((fulfill, reject) => {
      db('clients')
        .select('clients.*')
        .leftJoin('cms', 'cms.cmid', 'clients.cm')
        .where('cms.org', orgId)
        .where('clients.active', status)
      .then(clients => this._getMultiResponse(clients, fulfill)).catch(reject);
    });
  }

  static findBySameName(client) {
    return new Promise((fulfill, reject) => {
      let clients,
        user;

      Users.findById(client.cm)
      .then(user => db('clients')
        .select('clients.*')
        .leftJoin('cms', 'cms.cmid', 'clients.cm')
        .whereRaw(`LOWER(clients.first) LIKE LOWER('%${client.first}%') AND LOWER(clients.last) LIKE LOWER('%${client.last}%')`)
        .andWhere('cms.org', user.org)).then((resp) => {
          clients = resp;
          return fulfill(clients);
        }).catch(reject);
    });
  }

  static findByUser(userIDs, active) {
    return new Promise((fulfill, reject) => {
      Clients.findByUsers(userIDs, active)
      .then(clients => fulfill(clients)).catch(reject);
    });
  }

  // TODO maybe rename to findManyByUsersAndStatus ... or pull into controller,
  //      rename something appropriate to its actual function (providing data
  //      for the user list) and create a more generic function for just getting
  //      user records by id and status.
  static findByUsers(userIDs, activeStatus) {
    if (typeof activeStatus === 'undefined') activeStatus = true;
    if (!Array.isArray(userIDs)) userIDs = [userIDs,];

    return new Promise((fulfill, reject) => {
      let finalClientsObject;

      db('clients')
        .select('clients.*',
                'cms.cmid as user_id',
                'cms.first as user_first',
                'cms.middle as user_middle',
                'cms.last as user_last',
                'cms.department as department',
                'color_tags.color as color_tag',
                'color_tags.name as color_name')

        // Join with color tag table
        .leftJoin(
          db('color_tags')
            .where('active', true)
            .as('color_tags'),
          'color_tags.color_tag_id', 'clients.color_tag')

        .leftJoin('cms', 'clients.cm', 'cms.cmid')

        .whereIn('clients.cm', userIDs)
        .andWhere('clients.active', activeStatus)
        .orderBy(
          db.raw('upper(left(clients.last, 1)), (substring(clients.last from 2) || \'\')::varchar'),
          'asc')
      .then((clients) => {
        // Need to make sure there is a default color_tag color
        finalClientsObject = clients.map((client) => {
          if (!client.color_tag) client.color_tag = '#898989';
          if (!client.color_tag) client.color_name = 'None';
          return client;
        });

        // Get unread messages and add them to client list
        return Clients.getUnreadMessages(userIDs);
      }).then((unreads) => {
        finalClientsObject = finalClientsObject.map((client) => {
          client.unread = 0;
          unreads.forEach((unread) => {
            if (unread.client == client.clid) client.unread = Number(unread.unread);
          });
          return client;
        });

        // Now get all clientIDs to get Comm. Connections
        const clientIDs = finalClientsObject.map(client => client.clid);

        return CommConns.findByClientIdsWithCommMetaData(clientIDs);
      }).then((commconns) => {
        // Add each communication method to relevant client
        finalClientsObject = finalClientsObject.map((client) => {
          client.communications = [];
          commconns.forEach((commconn) => {
            if (client.clid == commconn.client) {
              client.communications.push(commconn);
            }
          });
          return client;
        });
        return fulfill(finalClientsObject);
      }).catch(reject);
    });
  }

  static getUnreadMessages(userIDs) {
    if (!Array.isArray(userIDs)) userIDs = [userIDs,];
    return new Promise((fulfill, reject) => {
      db('msgs')
        .select(db.raw('count(msgs.read) as unread, client'))
        .leftJoin('convos', 'convos.convid', 'msgs.convo')
        .whereIn('convos.cm', userIDs)
        .andWhere('msgs.read', false)
        .groupBy('convos.client')
      .then(unreads => fulfill(unreads)).catch(reject);
    });
  }

  static logActivity(clientID) {
    return new Promise((fulfill, reject) => {
      db('clients')
        .where('clid', clientID)
        .update({ updated: db.fn.now() })
      .then(() => {
        fulfill();
      }).catch(reject);
      return null;
    });
  }

  static transfer(client, fromUser, toUser, bundle) {
    return new Promise((fulfill, reject) => {
      db('clients')
        .where('clid', client)
        .andWhere('cm', fromUser)
        .update({ cm: toUser })
        .then(() => {
          // Always move the notifications over
          db('notifications')
           .where('client', client)
           .andWhere('cm', fromUser)
           .update({ cm: toUser });
        })
        .then(() => {
          // also switch convos
          if (typeof bundle !== 'undefined') {
            Conversations
              .transferUserReference(client, fromUser, toUser)
              .then(fulfill)
              .catch(reject);
          } else {
            fulfill();
          }
        })
        .catch(reject);
    });
  }

  static udpateColorTag(clientID, colorTagID) {
    return new Promise((fulfill, reject) => {
      db('clients')
        .update({ color_tag: colorTagID })
        .where('clid', clientID)
      .then(() => {
        fulfill();
      }).catch(reject);
    });
  }

}

Clients.primaryId = 'clid';
Clients.tableName = 'clients';
module.exports = Clients;

