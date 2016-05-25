import request from 'request-promise';
import getEndpointUrl from './utils/appsEndpoints.js';

class WorkspaceAppsClient {
  constructor({endpointUrl = getEndpointUrl('STABLE'), authToken}) {
    this.authToken = authToken;
    this.endpointUrl = endpointUrl;

    this.defaultRequestOptions = {
      json: true,
      headers: {
        Authorization: 'token ' + authToken,
      }
    };
  }

  listDependencies(account, workspace, service, paging, recursive) {
    const url = this.route.Apps(account, workspace, service);

    return request.get({
      ...this.defaultRequestOptions,
      url,
      qs: {
        paging,
        recursive: recursive ? true : null
      }
    });
  }

  getApp(account, workspace, app, context) {
    const url = this.route.App(account, workspace, app);

    return request.get({
      ...this.defaultRequestOptions,
      url,
      qs: {
        context
      }
    });
  }

  listAppDependencies(account, workspace, app, context, service, paging, recursive) {
    const url = this.route.AppDependencies(account, workspace, app, service);

    return request.get({
      ...this.defaultRequestOptions,
      url,
      qs: {
        paging,
        recursive: recursive ? true : null
      }
    });
  }

  listRootFolders(account, workspace, app, context) {
    const url = this.route.RootFolders(account, workspace, app);

    return request.get({
      ...this.defaultRequestOptions,
      url,
      qs: {
        context
      }
    });
  }

  listFiles(account, workspace, app, context, service, options) {
    const url = this.route.Files(account, workspace, app, service);

    return request.get({
      ...this.defaultRequestOptions,
      url,
      qs: {
        options,
        context
      }
    });
  }

  getFile(account, workspace, app, context, service, path) {
    const url = this.route.File(account, workspace, app, service, path);

    return request.get({
      ...this.defaultRequestOptions,
      url,
      qs: {
        context
      }
    });
  }

  callbackOnSetup(account, workspace, payload) {
    const url = this.route.Callback(account, workspace, 'on-setup');

    return request.post({
      ...this.defaultRequestOptions,
      url
    });
  }
}

WorkspaceAppsClient.prototype.routes = {
  Apps(account, workspace, service) {
    return `/${account}/workspaces/${workspace}/apps?service=${service}`;
  },

  App(account, workspace, app) {
    return `/${account}/workspaces/${workspace}/apps/${app}`;
  },

  AppDependencies(account, workspace, app, service) {
    return `/${account}/workspaces/${workspace}/apps/${app}/dependencies?service=${service}`;
  },

  RootFolders(account, workspace, app) {
    return `/${account}/workspaces/${workspace}/apps/${app}/files`;
  },

  Files(account, workspace, app, service) {
    return `/${account}/workspaces/${workspace}/apps/${app}/files/${service}`;
  },

  File(account, workspace, app, service, path) {
    return `/${account}/workspaces/${workspace}/apps/${app}/files/${service}/${path}`;
  },

  Callback(account, workspace, hook) {
    return `/${account}/workspaces/${workspace}/apps/callbacks/${hook}`;
  }
}

export default WorkspaceAppsClient;
