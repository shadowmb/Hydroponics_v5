{
	"Id": "138048265e76287ff45d1262f57356c7591b871ecc866c089d9c70800ddbf907",
	"Created": "2026-01-12T16:39:08.262836893Z",
	"Path": "mongod",
	"Args": [
		"--config",
		"/etc/mongod.conf"
	],
	"State": {
		"Status": "running",
		"Running": true,
		"Paused": false,
		"Restarting": false,
		"OOMKilled": false,
		"Dead": false,
		"Pid": 48670,
		"ExitCode": 0,
		"Error": "",
		"StartedAt": "2026-01-12T16:39:10.694841755Z",
		"FinishedAt": "0001-01-01T00:00:00Z"
	},
	"Image": "sha256:ccc5d3c5cbb3dcdea78e86669e73b14b995c399c2dfc120924c6cd6c795f5028",
	"ResolvConfPath": "/var/lib/docker/containers/138048265e76287ff45d1262f57356c7591b871ecc866c089d9c70800ddbf907/resolv.conf",
	"HostnamePath": "/var/lib/docker/containers/138048265e76287ff45d1262f57356c7591b871ecc866c089d9c70800ddbf907/hostname",
	"HostsPath": "/var/lib/docker/containers/138048265e76287ff45d1262f57356c7591b871ecc866c089d9c70800ddbf907/hosts",
	"LogPath": "/var/lib/docker/containers/138048265e76287ff45d1262f57356c7591b871ecc866c089d9c70800ddbf907/138048265e76287ff45d1262f57356c7591b871ecc866c089d9c70800ddbf907-json.log",
	"Name": "/objective_burnell",
	"RestartCount": 0,
	"Driver": "overlayfs",
	"Platform": "linux",
	"MountLabel": "",
	"ProcessLabel": "",
	"AppArmorProfile": "",
	"ExecIDs": null,
	"HostConfig": {
		"Binds": [],
		"ContainerIDFile": "",
		"LogConfig": {
			"Type": "json-file",
			"Config": {}
		},
		"NetworkMode": "bridge",
		"PortBindings": {},
		"RestartPolicy": {
			"Name": "no",
			"MaximumRetryCount": 0
		},
		"AutoRemove": false,
		"VolumeDriver": "",
		"VolumesFrom": null,
		"ConsoleSize": [
			0,
			0
		],
		"CapAdd": null,
		"CapDrop": null,
		"CgroupnsMode": "private",
		"Dns": null,
		"DnsOptions": null,
		"DnsSearch": null,
		"ExtraHosts": null,
		"GroupAdd": null,
		"IpcMode": "private",
		"Cgroup": "",
		"Links": null,
		"OomScoreAdj": 0,
		"PidMode": "",
		"Privileged": false,
		"PublishAllPorts": false,
		"ReadonlyRootfs": false,
		"SecurityOpt": null,
		"UTSMode": "",
		"UsernsMode": "",
		"ShmSize": 67108864,
		"Runtime": "runc",
		"Isolation": "",
		"CpuShares": 0,
		"Memory": 0,
		"NanoCpus": 0,
		"CgroupParent": "",
		"BlkioWeight": 0,
		"BlkioWeightDevice": null,
		"BlkioDeviceReadBps": null,
		"BlkioDeviceWriteBps": null,
		"BlkioDeviceReadIOps": null,
		"BlkioDeviceWriteIOps": null,
		"CpuPeriod": 0,
		"CpuQuota": 0,
		"CpuRealtimePeriod": 0,
		"CpuRealtimeRuntime": 0,
		"CpusetCpus": "",
		"CpusetMems": "",
		"Devices": null,
		"DeviceCgroupRules": null,
		"DeviceRequests": null,
		"MemoryReservation": 0,
		"MemorySwap": 0,
		"MemorySwappiness": null,
		"OomKillDisable": null,
		"PidsLimit": null,
		"Ulimits": null,
		"CpuCount": 0,
		"CpuPercent": 0,
		"IOMaximumIOps": 0,
		"IOMaximumBandwidth": 0,
		"MaskedPaths": [
			"/proc/acpi",
			"/proc/asound",
			"/proc/interrupts",
			"/proc/kcore",
			"/proc/keys",
			"/proc/latency_stats",
			"/proc/sched_debug",
			"/proc/scsi",
			"/proc/timer_list",
			"/proc/timer_stats",
			"/sys/devices/virtual/powercap",
			"/sys/firmware"
		],
		"ReadonlyPaths": [
			"/proc/bus",
			"/proc/fs",
			"/proc/irq",
			"/proc/sys",
			"/proc/sysrq-trigger"
		]
	},
	"Storage": {
		"RootFS": {
			"Snapshot": {
				"Name": "overlayfs"
			}
		}
	},
	"Mounts": [],
	"Config": {
		"Hostname": "138048265e76",
		"Domainname": "",
		"User": "mongodb",
		"AttachStdin": false,
		"AttachStdout": false,
		"AttachStderr": false,
		"ExposedPorts": {
			"27017/tcp": {}
		},
		"Tty": false,
		"OpenStdin": false,
		"StdinOnce": false,
		"Env": [
			"PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
			"DEBIAN_FRONTEND=noninteractive"
		],
		"Cmd": [
			"mongod",
			"--config",
			"/etc/mongod.conf"
		],
		"Image": "hydroponics_v5-mongodb:latest",
		"Volumes": null,
		"WorkingDir": "",
		"Entrypoint": null,
		"Labels": {
			"com.docker.compose.project": "hydroponics_v5",
			"com.docker.compose.service": "mongodb",
			"com.docker.compose.version": "5.0.0",
			"org.opencontainers.image.ref.name": "ubuntu",
			"org.opencontainers.image.version": "20.04"
		},
		"StopTimeout": 1
	},
	"NetworkSettings": {
		"SandboxID": "280023d5961cc50097c625d6adfef233833b91d0d61d694d2e8ee9ac0d952e4a",
		"SandboxKey": "/var/run/docker/netns/280023d5961c",
		"Ports": {
			"27017/tcp": null
		},
		"Networks": {
			"bridge": {
				"IPAMConfig": null,
				"Links": null,
				"Aliases": null,
				"DriverOpts": null,
				"GwPriority": 0,
				"NetworkID": "b17f888985eead57a2d4000cf2a5408894c744df8d7d00aeea88463216c1e1d7",
				"EndpointID": "aa8a4ab4eb865d2adfafc82e7e40c15a7fe898ef2640b39404dcbb2612f910f2",
				"Gateway": "172.17.0.1",
				"IPAddress": "172.17.0.2",
				"MacAddress": "a6:80:81:71:41:89",
				"IPPrefixLen": 16,
				"IPv6Gateway": "",
				"GlobalIPv6Address": "",
				"GlobalIPv6PrefixLen": 0,
				"DNSNames": null
			}
		}
	},
	"ImageManifestDescriptor": {
		"mediaType": "application/vnd.oci.image.manifest.v1+json",
		"digest": "sha256:461e61adcbf8c9276fc7018269515cd8bca1daa32420c9a6c36d7f54ee68bf50",
		"size": 1810,
		"platform": {
			"architecture": "amd64",
			"os": "linux"
		}
	}
}