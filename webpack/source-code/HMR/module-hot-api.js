//api 源码目录  \node_modules\webpack\lib\HotModuleReplacement.runtime.js

/*global $hash$ $requestTimeout$ installedModules $require$ hotDownloadManifest hotDownloadUpdateChunk hotDisposeChunk modules */
// global $hash$ $requestTimeout$ installedModules $require$ hotDownloadManifest hotDownloadUpdateChunk hotDisposeChunk modules  等在代码生成阶段会被替换

module.exports = function() {

	var hotApplyOnUpdate = true;
	var hotCurrentHash = $hash$; // eslint-disable-line no-unused-vars
	var hotRequestTimeout = $requestTimeout$;
	var hotCurrentModuleData = {};
	var hotCurrentChildModule; // eslint-disable-line no-unused-vars
	var hotCurrentParents = []; // eslint-disable-line no-unused-vars
	var hotCurrentParentsTemp = []; // eslint-disable-line no-unused-vars

	function hotCreateRequire(moduleId) { // eslint-disable-line no-unused-vars
		var me = installedModules[moduleId];
		if(!me) return $require$;
		var fn = function(request) {
			if(me.hot.active) {
				if(installedModules[request]) {
					if(installedModules[request].parents.indexOf(moduleId) < 0)
						installedModules[request].parents.push(moduleId);
				} else {
					hotCurrentParents = [moduleId];
					hotCurrentChildModule = request;
				}
				if(me.children.indexOf(request) < 0)
					me.children.push(request);
			} else {
				console.warn("[HMR] unexpected require(" + request + ") from disposed module " + moduleId);
				hotCurrentParents = [];
			}
			return $require$(request);
		};
		var ObjectFactory = function ObjectFactory(name) {
			return {
				configurable: true,
				enumerable: true,
				get: function() {
					return $require$[name];
				},
				set: function(value) {
					$require$[name] = value;
				}
			};
		};
		for(var name in $require$) {
			if(Object.prototype.hasOwnProperty.call($require$, name) && name !== "e") {
				Object.defineProperty(fn, name, ObjectFactory(name));
			}
		}
		fn.e = function(chunkId) {
			if(hotStatus === "ready")
				hotSetStatus("prepare");
			hotChunksLoading++;
			return $require$.e(chunkId).then(finishChunkLoading, function(err) {
				finishChunkLoading();
				throw err;
			});

			function finishChunkLoading() {
				hotChunksLoading--;
				if(hotStatus === "prepare") {
					if(!hotWaitingFilesMap[chunkId]) {
						hotEnsureUpdateChunk(chunkId);
					}
					if(hotChunksLoading === 0 && hotWaitingFiles === 0) {
						hotUpdateDownloaded();
					}
				}
			}
		};
		return fn;
	}

	function hotCreateModule(moduleId) { // eslint-disable-line no-unused-vars
		var hot = {
			// private stuff
			_acceptedDependencies: {},
			_declinedDependencies: {},
			_selfAccepted: false,
			_selfDeclined: false,
			_disposeHandlers: [],
			_main: hotCurrentChildModule !== moduleId,

			// Module API
            active: true,
            // 即 module.hot.accept ，添加回调函数，热更新完成后执行
			accept: function(dep, callback) {
				if(typeof dep === "undefined")
					hot._selfAccepted = true;
				else if(typeof dep === "function")
					hot._selfAccepted = dep;
				else if(typeof dep === "object")
					for(var i = 0; i < dep.length; i++)
						hot._acceptedDependencies[dep[i]] = callback || function() {};
				else
					hot._acceptedDependencies[dep] = callback || function() {};
            },
            //移除模块
			decline: function(dep) {
				if(typeof dep === "undefined")
					hot._selfDeclined = true;
				else if(typeof dep === "object")
					for(var i = 0; i < dep.length; i++)
						hot._declinedDependencies[dep[i]] = true;
				else
					hot._declinedDependencies[dep] = true;
			},
			dispose: function(callback) {
				hot._disposeHandlers.push(callback);
			},
			addDisposeHandler: function(callback) {
				hot._disposeHandlers.push(callback);
			},
			removeDisposeHandler: function(callback) {
				var idx = hot._disposeHandlers.indexOf(callback);
				if(idx >= 0) hot._disposeHandlers.splice(idx, 1);
			},

			// Management API
			check: hotCheck,
            apply: hotApply,
            
            // 返回热更新状态，依次为 idle(空闲) check(正在检查) prepare(更新前预准备) ready(可以更新) apply(正在更新) idle...
			status: function(l) {
				if(!l) return hotStatus;
				hotStatusHandlers.push(l);
			},
			addStatusHandler: function(l) {
				hotStatusHandlers.push(l);
			},
			removeStatusHandler: function(l) {
				var idx = hotStatusHandlers.indexOf(l);
				if(idx >= 0) hotStatusHandlers.splice(idx, 1);
			},

			//inherit from previous dispose call
			data: hotCurrentModuleData[moduleId]
		};
		hotCurrentChildModule = undefined;
		return hot;
	}

	var hotStatusHandlers = [];
	var hotStatus = "idle";

	function hotSetStatus(newStatus) {
		hotStatus = newStatus;
		for(var i = 0; i < hotStatusHandlers.length; i++)
			hotStatusHandlers[i].call(null, newStatus);
	}

	// while downloading
	var hotWaitingFiles = 0;
	var hotChunksLoading = 0;
	var hotWaitingFilesMap = {};
	var hotRequestedFilesMap = {};
	var hotAvailableFilesMap = {};
	var hotDeferred;

	// The update info
	var hotUpdate, hotUpdateNewHash;

	function toModuleId(id) {
		var isNumber = (+id) + "" === id;
		return isNumber ? +id : id;
	}

    /* 
        检查是否可以更新 
        @param apply[Boolean] 若检查可以更新，是否继续直接更新
    */
	function hotCheck(apply) {
		if(hotStatus !== "idle") throw new Error("check() is only allowed in idle status");
        hotApplyOnUpdate = apply;
        
        // 置为检查阶段
        hotSetStatus("check");

        // 下载更新清单，检查是否有更新
		return hotDownloadManifest(hotRequestTimeout).then(function(update) {
			if(!update) {
				hotSetStatus("idle");
				return null;
			}
			hotRequestedFilesMap = {};
			hotWaitingFilesMap = {};
			hotAvailableFilesMap = update.c;
			hotUpdateNewHash = update.h;

			hotSetStatus("prepare");
			var promise = new Promise(function(resolve, reject) {
				hotDeferred = {
					resolve: resolve,
					reject: reject
				};
			});
			hotUpdate = {};
			/*foreachInstalledChunks*/
			{ // eslint-disable-line no-lone-blocks
				/*globals chunkId */
				hotEnsureUpdateChunk(chunkId);
			}
			if(hotStatus === "prepare" && hotChunksLoading === 0 && hotWaitingFiles === 0) {
                //可以更新，进入下一阶段
				hotUpdateDownloaded();
			}
			return promise;
		});
	}

	function hotAddUpdateChunk(chunkId, moreModules) { // eslint-disable-line no-unused-vars
		if(!hotAvailableFilesMap[chunkId] || !hotRequestedFilesMap[chunkId])
			return;
		hotRequestedFilesMap[chunkId] = false;
		for(var moduleId in moreModules) {
			if(Object.prototype.hasOwnProperty.call(moreModules, moduleId)) {
				hotUpdate[moduleId] = moreModules[moduleId];
			}
		}
		if(--hotWaitingFiles === 0 && hotChunksLoading === 0) {
			hotUpdateDownloaded();
		}
	}

	function hotEnsureUpdateChunk(chunkId) {
		if(!hotAvailableFilesMap[chunkId]) {
			hotWaitingFilesMap[chunkId] = true;
		} else {
			hotRequestedFilesMap[chunkId] = true;
			hotWaitingFiles++;
			hotDownloadUpdateChunk(chunkId);
		}
	}

	function hotUpdateDownloaded() {
		hotSetStatus("ready");
		var deferred = hotDeferred;
		hotDeferred = null;
        if(!deferred) return;
        // 直接执行更新
		if(hotApplyOnUpdate) {
			// Wrap deferred object in Promise to mark it as a well-handled Promise to
			// avoid triggering uncaught exception warning in Chrome.
			// See https://bugs.chromium.org/p/chromium/issues/detail?id=465666
			Promise.resolve().then(function() {
				return hotApply(hotApplyOnUpdate);
			}).then(
				function(result) {
					deferred.resolve(result);
				},
				function(err) {
					deferred.reject(err);
				}
			);
		} else {
            // 返回需要更新的模块
			var outdatedModules = [];
			for(var id in hotUpdate) {
				if(Object.prototype.hasOwnProperty.call(hotUpdate, id)) {
					outdatedModules.push(toModuleId(id));
				}
			}
			deferred.resolve(outdatedModules);
		}
	}

	function hotApply(options) {
		if(hotStatus !== "ready") throw new Error("apply() is only allowed in ready status");
		options = options || {};

		var cb;
		var i;
		var j;
		var module;
		var moduleId;

		function getAffectedStuff(updateModuleId) {
			var outdatedModules = [updateModuleId];
			var outdatedDependencies = {};

			var queue = outdatedModules.slice().map(function(id) {
				return {
					chain: [id],
					id: id
				};
			});
			while(queue.length > 0) {
				var queueItem = queue.pop();
				var moduleId = queueItem.id;
				var chain = queueItem.chain;
				module = installedModules[moduleId];
				if(!module || module.hot._selfAccepted)
					continue;
				if(module.hot._selfDeclined) {
					return {
						type: "self-declined",
						chain: chain,
						moduleId: moduleId
					};
				}
				if(module.hot._main) {
					return {
						type: "unaccepted",
						chain: chain,
						moduleId: moduleId
					};
				}
				for(var i = 0; i < module.parents.length; i++) {
					var parentId = module.parents[i];
					var parent = installedModules[parentId];
					if(!parent) continue;
					if(parent.hot._declinedDependencies[moduleId]) {
						return {
							type: "declined",
							chain: chain.concat([parentId]),
							moduleId: moduleId,
							parentId: parentId
						};
					}
					if(outdatedModules.indexOf(parentId) >= 0) continue;
					if(parent.hot._acceptedDependencies[moduleId]) {
						if(!outdatedDependencies[parentId])
							outdatedDependencies[parentId] = [];
						addAllToSet(outdatedDependencies[parentId], [moduleId]);
						continue;
					}
					delete outdatedDependencies[parentId];
					outdatedModules.push(parentId);
					queue.push({
						chain: chain.concat([parentId]),
						id: parentId
					});
				}
			}

			return {
				type: "accepted",
				moduleId: updateModuleId,
				outdatedModules: outdatedModules,
				outdatedDependencies: outdatedDependencies
			};
		}

		function addAllToSet(a, b) {
			for(var i = 0; i < b.length; i++) {
				var item = b[i];
				if(a.indexOf(item) < 0)
					a.push(item);
			}
		}

		// at begin all updates modules are outdated
        // the "outdated" status can propagate to parents if they don't accept the children
        //将所有需要更新的模块置为过时的状态（可以冒泡，直到父级模块中包含accept更新处理，或者一直冒泡到入口模块，更新失败）
		var outdatedDependencies = {};
		var outdatedModules = [];
		var appliedUpdate = {};

		var warnUnexpectedRequire = function warnUnexpectedRequire() {
			console.warn("[HMR] unexpected require(" + result.moduleId + ") to disposed module");
		};

		for(var id in hotUpdate) {
			if(Object.prototype.hasOwnProperty.call(hotUpdate, id)) {
				moduleId = toModuleId(id);
				var result;
				if(hotUpdate[id]) {
					result = getAffectedStuff(moduleId);
				} else {
					result = {
						type: "disposed",
						moduleId: id
					};
				}
				var abortError = false;
				var doApply = false;
				var doDispose = false;
				var chainInfo = "";
				if(result.chain) {
					chainInfo = "\nUpdate propagation: " + result.chain.join(" -> ");
				}
				switch(result.type) {
					case "self-declined":
						if(options.onDeclined)
							options.onDeclined(result);
						if(!options.ignoreDeclined)
							abortError = new Error("Aborted because of self decline: " + result.moduleId + chainInfo);
						break;
					case "declined":
						if(options.onDeclined)
							options.onDeclined(result);
						if(!options.ignoreDeclined)
							abortError = new Error("Aborted because of declined dependency: " + result.moduleId + " in " + result.parentId + chainInfo);
						break;
					case "unaccepted":
						if(options.onUnaccepted)
							options.onUnaccepted(result);
						if(!options.ignoreUnaccepted)
							abortError = new Error("Aborted because " + moduleId + " is not accepted" + chainInfo);
						break;
					case "accepted":
						if(options.onAccepted)
							options.onAccepted(result);
						doApply = true;
						break;
					case "disposed":
						if(options.onDisposed)
							options.onDisposed(result);
						doDispose = true;
						break;
					default:
						throw new Error("Unexception type " + result.type);
				}
				if(abortError) {
					hotSetStatus("abort");
					return Promise.reject(abortError);
				}
				if(doApply) {
					appliedUpdate[moduleId] = hotUpdate[moduleId];
					addAllToSet(outdatedModules, result.outdatedModules);
					for(moduleId in result.outdatedDependencies) {
						if(Object.prototype.hasOwnProperty.call(result.outdatedDependencies, moduleId)) {
							if(!outdatedDependencies[moduleId])
								outdatedDependencies[moduleId] = [];
							addAllToSet(outdatedDependencies[moduleId], result.outdatedDependencies[moduleId]);
						}
					}
				}
				if(doDispose) {
					addAllToSet(outdatedModules, [result.moduleId]);
					appliedUpdate[moduleId] = warnUnexpectedRequire;
				}
			}
		}

		// Store self accepted outdated modules to require them later by the module system
		var outdatedSelfAcceptedModules = [];
		for(i = 0; i < outdatedModules.length; i++) {
			moduleId = outdatedModules[i];
			if(installedModules[moduleId] && installedModules[moduleId].hot._selfAccepted)
				outdatedSelfAcceptedModules.push({
					module: moduleId,
					errorHandler: installedModules[moduleId].hot._selfAccepted
				});
		}

        // Now in "dispose" phase
        // dispose 阶段
		hotSetStatus("dispose");
		Object.keys(hotAvailableFilesMap).forEach(function(chunkId) {
			if(hotAvailableFilesMap[chunkId] === false) {
				hotDisposeChunk(chunkId);
			}
		});

		var idx;
		var queue = outdatedModules.slice();
		while(queue.length > 0) {
			moduleId = queue.pop();
			module = installedModules[moduleId];
			if(!module) continue;

			var data = {};

			// Call dispose handlers
			var disposeHandlers = module.hot._disposeHandlers;
			for(j = 0; j < disposeHandlers.length; j++) {
				cb = disposeHandlers[j];
				cb(data);
			}
			hotCurrentModuleData[moduleId] = data;

            // 禁用当前模块
			// disable module (this disables requires from this module)
			module.hot.active = false;

            //从内存中移除
			// remove module from cache
			delete installedModules[moduleId];

			// when disposing there is no need to call dispose handler
			delete outdatedDependencies[moduleId];

			// remove "parents" references from all children
			for(j = 0; j < module.children.length; j++) {
				var child = installedModules[module.children[j]];
				if(!child) continue;
				idx = child.parents.indexOf(moduleId);
				if(idx >= 0) {
					child.parents.splice(idx, 1);
				}
			}
		}

		// remove outdated dependency from module children
		var dependency;
		var moduleOutdatedDependencies;
		for(moduleId in outdatedDependencies) {
			if(Object.prototype.hasOwnProperty.call(outdatedDependencies, moduleId)) {
				module = installedModules[moduleId];
				if(module) {
					moduleOutdatedDependencies = outdatedDependencies[moduleId];
					for(j = 0; j < moduleOutdatedDependencies.length; j++) {
						dependency = moduleOutdatedDependencies[j];
						idx = module.children.indexOf(dependency);
						if(idx >= 0) module.children.splice(idx, 1);
					}
				}
			}
		}

        // Not in "apply" phase
        // apply 阶段
		hotSetStatus("apply");

		hotCurrentHash = hotUpdateNewHash;

        // insert new code
        // 添加到模块系统中
		for(moduleId in appliedUpdate) {
			if(Object.prototype.hasOwnProperty.call(appliedUpdate, moduleId)) {
				modules[moduleId] = appliedUpdate[moduleId];
			}
		}

        // call accept handlers
        // 调用accept回调
		var error = null;
		for(moduleId in outdatedDependencies) {
			if(Object.prototype.hasOwnProperty.call(outdatedDependencies, moduleId)) {
				module = installedModules[moduleId];
				if(module) {
					moduleOutdatedDependencies = outdatedDependencies[moduleId];
					var callbacks = [];
					for(i = 0; i < moduleOutdatedDependencies.length; i++) {
						dependency = moduleOutdatedDependencies[i];
						cb = module.hot._acceptedDependencies[dependency];
						if(cb) {
							if(callbacks.indexOf(cb) >= 0) continue;
							callbacks.push(cb);
						}
					}
					for(i = 0; i < callbacks.length; i++) {
						cb = callbacks[i];
						try {
							cb(moduleOutdatedDependencies);
						} catch(err) {
							if(options.onErrored) {
								options.onErrored({
									type: "accept-errored",
									moduleId: moduleId,
									dependencyId: moduleOutdatedDependencies[i],
									error: err
								});
							}
							if(!options.ignoreErrored) {
								if(!error)
									error = err;
							}
						}
					}
				}
			}
		}

		// Load self accepted modules
		for(i = 0; i < outdatedSelfAcceptedModules.length; i++) {
			var item = outdatedSelfAcceptedModules[i];
			moduleId = item.module;
			hotCurrentParents = [moduleId];
			try {
				$require$(moduleId);
			} catch(err) {
				if(typeof item.errorHandler === "function") {
					try {
						item.errorHandler(err);
					} catch(err2) {
						if(options.onErrored) {
							options.onErrored({
								type: "self-accept-error-handler-errored",
								moduleId: moduleId,
								error: err2,
								orginalError: err, // TODO remove in webpack 4
								originalError: err
							});
						}
						if(!options.ignoreErrored) {
							if(!error)
								error = err2;
						}
						if(!error)
							error = err;
					}
				} else {
					if(options.onErrored) {
						options.onErrored({
							type: "self-accept-errored",
							moduleId: moduleId,
							error: err
						});
					}
					if(!options.ignoreErrored) {
						if(!error)
							error = err;
					}
				}
			}
		}

		// handle errors in accept handlers and self accepted module load
		if(error) {
			hotSetStatus("fail");
			return Promise.reject(error);
		}

		hotSetStatus("idle");
		return new Promise(function(resolve) {
			resolve(outdatedModules);
		});
	}
};
