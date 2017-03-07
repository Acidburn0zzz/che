/*
 * Copyright (c) 2015-2017 Codenvy, S.A.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *   Codenvy, S.A. - initial API and implementation
 */
'use strict';

interface IremoteStackAPI<T> extends ng.resource.IResourceClass<T> {
  getStacks: any;
  getStack: any;
  updateStack: any;
  createStack: any;
  deleteStack: any;
}

/**
 * This class is handling the stacks retrieval
 * It sets to the array of stacks
 * @author Florent Benoit
 * @author Ann Shumilova
 */
export class CheStack {
  $resource: ng.resource.IResourceService;
  stacksById: { [stackId: string]: che.IStack };
  stacks: Array<any>;
  usedStackNames: Array<string>;
  remoteStackAPI: IremoteStackAPI<any>;

  /**
   * Default constructor that is using resource
   * @ngInject for Dependency injection
   */
  constructor($resource: ng.resource.IResourceService) {

    // keep resource
    this.$resource = $resource;

    // stacks per id
    this.stacksById = {};

    // stacks
    this.stacks = [];

    // stack names
    this.usedStackNames = [];

    // remote call
    this.remoteStackAPI = <IremoteStackAPI<any>>this.$resource('/api/stack', {}, {
      getStacks: {method: 'GET', url: '/api/stack?maxItems=50', isArray: true}, //TODO 50 items is temp solution while paging is not added
      getStack: {method: 'GET', url: '/api/stack/:stackId'},
      updateStack: {method: 'PUT', url: '/api/stack/:stackId'},
      createStack: {method: 'POST', url: '/api/stack'},
      deleteStack: {method: 'DELETE', url: '/api/stack/:stackId'}
    });
  }

  /**
   * Gets stack template
   * @returns {che.IStack}
   */
  getStackTemplate(): che.IStack {
    let stack = {
      'name': 'New Stack',
      'description': 'New Java Stack',
      'scope': 'general',
      'tags': [
        'Java 1.8'
      ],
      'components': [],
      'workspaceConfig': {
        'projects': [],
        'environments': {
          'default': {
            'machines': {
              'dev-machine': {
                'agents': [
                  'org.eclipse.che.terminal', 'org.eclipse.che.ws-agent', 'org.eclipse.che.ssh'
                ],
                'servers': {},
                'attributes': {
                  'memoryLimitBytes': '2147483648'
                }
              }
            },
            'recipe': {
              'content': 'services:\n dev-machine:\n  image: codenvy/ubuntu_jdk8\n',
              'contentType': 'application/x-yaml',
              'type': 'compose'
            }
          }
        },
        'name': 'default',
        'defaultEnv': 'default',
        'description': null,
        'commands': []
      }
    };

    let stackName = stack.name;
    do {
      /* tslint:disable */
      stackName = stack.name + '-' + (('0000' + (Math.random() * Math.pow(36, 4) << 0).toString(36)).slice(-4));
      /* tslint:enable */
    } while (!this.isUniqueName(stackName));
    stack.name = stackName;

    return stack;
  }

  /**
   * Check if the stack's name is unique.
   * @param name: string
   * @returns {boolean}
   */
  isUniqueName(name: string): boolean {
    return this.usedStackNames.indexOf(name) === -1;
  }

  /**
   * Fetch the stacks
   * @returns {ng.IPromise<any>}
   */
  fetchStacks(): ng.IPromise<any> {
    let promise = this.remoteStackAPI.getStacks().$promise;
    let updatedPromise = promise.then((stacks: Array<che.IStack>) => {
      // reset global stacks list
      this.stacks.length = 0;
      for (let member: string in this.stacksById) {
        delete this.stacksById[member];
      }
      // reset global stack names list
      this.usedStackNames.length = 0;
      stacks.forEach((stack: che.IStack) => {
        this.usedStackNames.push(stack.name);
        // add element on the list
        this.stacksById[stack.id] = stack;
        this.stacks.push(stack);
      });
    });

    return updatedPromise;
  }

  /**
   * Gets all stacks
   * @returns {Array<any>}
   */
  getStacks(): Array<any> {
    return this.stacks;
  }

  /**
   * The stacks per id
   * @param id: string
   * @returns {stack: che.IStack}
   */
  getStackById(id: string): { stack: che.IStack } {
    return this.stacksById[id];
  }

  /**
   * Creates new stack.
   * @param stack: any - data for new stack
   * @returns {ng.IPromise<any>}
   */
  createStack(stack: any): ng.IPromise<any> {
    return this.remoteStackAPI.createStack({}, stack).$promise;
  }

  /**
   * Fetch pointed stack.
   * @param stackId: string - stack's id
   * @returns {ng.IPromise<any>}
   */
  fetchStack(stackId: string): ng.IPromise<any> {
    return this.remoteStackAPI.getStack({stackId: stackId}).$promise;
  }

  /**
   * Update pointed stack.
   * @param stackId: string - stack's id
   * @param stack: any - data for new stack
   * @returns {ng.IPromise<any>}
   */
  updateStack(stackId: string, stack: any): ng.IPromise<any> {
    return this.remoteStackAPI.updateStack({stackId: stackId}, stack).$promise;
  }

  /**
   * Delete pointed stack.
   * @param stackId: string - stack's id
   * @returns {ng.IPromise<any>}
   */
  deleteStack(stackId: string): ng.IPromise<any> {
    return this.remoteStackAPI.deleteStack({stackId: stackId}).$promise;
  }
}


