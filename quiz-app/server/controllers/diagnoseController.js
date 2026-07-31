import { NodeSSH } from 'node-ssh';
import fs from 'fs';

const diagnoseCheck = {
    "nodes" : {
        "static_transform_publisher odom odom_combined": {
            "/base_to_camera_link": { "status": false },
            "/base_to_gyro": { "status": false },
            "/base_to_laser": { "status": false },
            "/base_to_link": { "status": false },
        },
        "Nav2": {
            "/amcl": { "status": false },
            "/basic_navigator": { "status": false },
            "/behavior_server": { "status": false },
            "/bt_navigator": { "status": false },
            "/bt_navigator_navigate_through_poses_rclcpp_node": { "status": false },
            "/bt_navigator_navigate_to_pose_rclcpp_node": { "status": false },
            "/controller_server": { "status": false },
            "/ekf_filter_node": { "status": false },
            "/global_costmap/global_costmap": { "status": false },
            "/imu_filter_madgwick": { "status": false },
            "/joint_state_publisher": { "status": false },
            "/lifecycle_manager_localization": { "status": false },
            "/lifecycle_manager_navigation": { "status": false },
            "/local_costmap/local_costmap": { "status": false },
            "/lslidar_driver_node": { "status": false },
            "/map_server": { "status": false },
            "/nav2_container": { "status": false },
            "/planner_server": { "status": false },
            "/publish_back_pose": { "status": false },
            "/smoother_server": { "status": false },
            "/velocity_smoother": { "status": false },
            "/waypoint_cycle": { "status": false },
            "/waypoint_follower": { "status": false }
        },
        "drive_mux": {
            "/drive_mux": { "status": false }
        },
        "quiz_bt_node": {
            "/quiz_bt_node": { "status": false }
        },
        "drive_to_coord": {
            "/drive_to_goal": { "status": false }
        },
        "bumper": {
            "/gpio_reader_node": { "status": false }
        },
        "Camera": {
            "/camera/camera": { "status": false },
            "/robot_state_publisher_flagship_mec_dl": { "status": false },
            "/wheeltec_robot": { "status": false }
        },
        "Visualtracker": {
            "/people_follower": { "status": false }
        },
        "pointcloud_to_laserscan": {
            "/pointcloud_to_laserscan": { "status": false }
        },
        "keepout_filter": {
            "/costmap_filter_info_server": { "status": false },
            "/keepout_filter_throttle": { "status": false },
            "/keepout_map_server": { "status": false },
            "/lifecycle_manager_costmap_filters": { "status": false }
        },
        "auto_recharge": {
            "/auto_recharger": { "status": false }
        },
        "robot_position_reset": {
        },
        "april_tabloo": {
            "/apriltag_absolute_pose": { "status": false }
        },
        "mecabot_bt": {
            "/btArrivedAtVisitors": { "status": false },
            "/btBatteryCharged": { "status": false },
            "/btBatteryFull": { "status": false },
            "/btBatteryStopDrive": { "status": false },
            "/btCheckAdminCondition": { "status": false },
            "/btCheckAdminPanel": { "status": false },
            "/btCheckButtonState": { "status": false },
            "/btCheckNetworkError": { "status": false },
            "/btCheckingNearbyVisitors": { "status": false },
            "/btConnectionLost": { "status": false },
            "/btDriveToChargingStation": { "status": false },
            "/btDriveWorkArea": { "status": false },
            "/btFallbackDriveToChargingStation": { "status": false },
            "/btFallbackDriveToWorkArea": { "status": false },
            "/btFallbackIsRobotAtChargingStation": { "status": false },
            "/btFallbackIsRobotAtWorkArea": { "status": false },
            "/btInWorkingZone": { "status": false },
            "/btIsRobotAtWorkArea": { "status": false },
            "/btIsRobotCharging": { "status": false },
            "/btMainBTSetErrorFlag": { "status": false },
            "/btMainBTStopDrive": { "status": false },
            "/btRobotDriveToChargingStation": { "status": false },
            "/btRobotExplore": { "status": false },
            "/btRobotFailedDriveToChargingStation": { "status": false },
            "/btRobotIsRobotAtChargingStation": { "status": false },
            "/btRobotWaitInChargingStation": { "status": false },
            "/btStartDrivingToPeople": { "status": false },
            "/btStatusDriveToChargingDock": { "status": false },
            "/btStopRobotCharging": { "status": false },
            "/bt_BatteryOk_node": { "status": false },
            "/bt_robot_rotation_follow_me": { "status": false },
            "/btDriveQuizLocation": { "status": false },
            "/btFallbackDriveQuizLocation": { "status": false },
            "/btFallbackIsRobotAtQuiz": { "status": false },
            "/btIsRobotAtQuiz": { "status": false },
            "/btWaitQuizToEnd": { "status": false },
            "/bt_robot_at_quiz_node": { "status": false }
        },
        "autocharge_batcheck": {
            "/autocharge_batcheck": { "status": false }
        }
    },

    "topics": {
        "temp": {
            "/BatteryAverageVoltage": { "status": false },
            "/BehaviorTreeNode": { "status": false },
            "/ManualDriveControleLocation": { "status": false },
            "/PowerVoltage": { "status": false },
            "/admin": { "status": false },
            "/amcl/transition_event": { "status": false },
            "/amcl_pose": { "status": false },
            "/auto_recharge_event": { "status": false },
            "/battery_percentage": { "status": false },
            "/behavior_server/transition_event": { "status": false },
            "/behavior_tree_log": { "status": false },
            "/bond": { "status": false },
            "/btDriveCoord": { "status": false },
            "/bt_navigator/transition_event": { "status": false },
            "/bump_cmd_vel": { "status": false },
            "/camera/color/camera_info": { "status": false },
            "/camera/color/image_raw": { "status": false },
            "/camera/depth/camera_info": { "status": false },
            "/camera/depth/image_raw": { "status": false },
            "/camera/depth/points": { "status": false },
            "/camera/ir/camera_info": { "status": false },
            "/camera/ir/image_raw": { "status": false },
            "/camera_scan": { "status": false },
            "/charge_XSTOP": { "status": false },
            "/charge_cmd_vel": { "status": false },
            "/charger_position_update": { "status": false },
            "/chassis_security": { "status": false },
            "/clicked_point": { "status": false },
            "/cmd_vel": { "status": false },
            "/cmd_vel_nav": { "status": false },
            "/connection": { "status": false },
            "/controller_server/transition_event": { "status": false },
            "/costmap_filter_info": { "status": false },
            "/costmap_filter_info_server/transition_event": { "status": false },
            "/detected_image": { "status": false },
            "/diagnostics": { "status": false },
            "/drive_to_coord_status": { "status": false },
            "/estop_cmd_vel": { "status": false },
            "/force_charge": { "status": false },
            "/global_costmap/costmap": { "status": false },
            "/global_costmap/costmap_raw": { "status": false },
            "/global_costmap/costmap_updates": { "status": false },
            "/global_costmap/footprint": { "status": false },
            "/global_costmap/global_costmap/transition_event": { "status": false },
            "/global_costmap/published_footprint": { "status": false },
            "/goal_marker": { "status": false },
            "/goal_pose": { "status": false },
            "/gui_cmd_vel": { "status": false },
            "/imu/data": { "status": false },
            "/imu/data_raw": { "status": false },
            "/infrared_docking_status": { "status": false },
            "/initialpose": { "status": false },
            "/joint_states": { "status": false },
            "/keepout_filter_mask": { "status": false },
            "/keepout_map_server/transition_event": { "status": false },
            "/local_costmap/clearing_endpoints": { "status": false },
            "/local_costmap/costmap": { "status": false },
            "/local_costmap/costmap_raw": { "status": false },
            "/local_costmap/costmap_updates": { "status": false },
            "/local_costmap/footprint": { "status": false },
            "/local_costmap/local_costmap/transition_event": { "status": false },
            "/local_costmap/published_footprint": { "status": false },
            "/local_costmap/voxel_grid": { "status": false },
            "/lslidar_driver_node/transition_event": { "status": false },
            "/lslidar_order": { "status": false },
            "/map": { "status": false },
            "/map_server/transition_event": { "status": false },
            "/object_tracker/current_position": { "status": false },
            "/odom": { "status": false },
            "/odom_combined": { "status": false },
            "/parameter_events": { "status": false },
            "/particle_cloud": { "status": false },
            "/path_point": { "status": false },
            "/peoplesearchcoord": { "status": false },
            "/plan": { "status": false },
            "/plan_smoothed": { "status": false },
            "/planner_server/transition_event": { "status": false },
            "/quiz": { "status": false },
            "/reboot_command": { "status": false },
            "/red_vel": { "status": false },
            "/resetPositionChargeStation": { "status": false },
            "/reset_active": { "status": false },
            "/robot_charging_current": { "status": false },
            "/robot_charging_flag": { "status": false },
            "/robot_cmd_vel": { "status": false },
            "/robot_description": { "status": false },
            "/robot_recharge_flag": { "status": false },
            "/robot_red_flag": { "status": false },
            "/rosout": { "status": false },
            "/rpitopic": { "status": false },
            "/scan": { "status": false },
            "/search_cmd_vel": { "status": false },
            "/set_pose": { "status": false },
            "/smoother_server/transition_event": { "status": false },
            "/speed_limit": { "status": false },
            "/target_distance": { "status": false },
            "/tf": { "status": false },
            "/tf_static": { "status": false },
            "/toggle_keepout": { "status": false },
            "/tracking_enable": { "status": false },
            "/trajectories": { "status": false },
            "/transformed_global_plan": { "status": false },
            "/turn_cmd_vel": { "status": false },
            "/velocity_smoother/transition_event": { "status": false },
            "/waypoint_follower/transition_event": { "status": false }
        }
    }
}

export const makeDiagnose = async (req, res, next) => {
    const ssh = new NodeSSH();

    // 1. Controleer of het IP-adres bestaat
    const ROBOT_IP = process.env.ROBOT_IP;
    if (!ROBOT_IP) {
        console.error("ROBOT_IP ontbreekt in environment variables!");
        return res.status(500).json({
            success: false,
            message: "ROBOT_IP ontbreekt in environment variables"
        });
    }

    // 2. Connecteer naar de robot via SSH
    try {
        const privateKeyContent = fs.readFileSync('/home/robotoo/.ssh/id_rsa', 'utf8');

        await ssh.connect({
            host: ROBOT_IP,
            username: 'wheeltec',
            privateKey: privateKeyContent
        });
    } catch (error) {
        ssh.dispose();
        console.error('Fout tijdens het maken van de SSH verbinding:', error);
        return res.status(500).json({
            success: false,
            message: error.message + ' Fout tijdens maken van de ssh verbinding'
        });
    }

    // 3 & 4. Bereid de commando's voor en voer ze in één sessie uit
    try {
        const commandToRun = `
            cd wheeltec_ros2 &&
            source install/setup.bash &&
            ros2 node list
        `;

        const result = await ssh.execCommand(commandToRun);
        
        if (result.stdout) {
            // 1. Splits de output op nieuwe regels, verwijder witruimtes en filter lege regels eruit
            const activeNodes = result.stdout
                .split('\n')
                .map(node => node.trim())
                .filter(node => node.length > 0);

            // 2. Zet het om in een Set voor snellere zoekopdrachten
            const activeNodesSet = new Set(activeNodes);

            // 3. Loop door alle commando's en bijbehorende nodes in diagnoseCheck
            for (const groupKey in diagnoseCheck.nodes) {
                const nodeGroup = diagnoseCheck.nodes[groupKey];
                
                // Loop door de werkelijke ROS-nodes (bijv. "/amcl", "/basic_navigator")
                for (const nodeName in nodeGroup) {
                    
                    // 4. Update de status afhankelijk van of de node in de Set voorkomt
                    if (activeNodesSet.has(nodeName)) {
                        diagnoseCheck.nodes[groupKey][nodeName].status = true;
                    } else {
                        diagnoseCheck.nodes[groupKey][nodeName].status = false;
                    }
                }
            }
        } else if (result.stderr) {
            console.warn('Waarschuwing of fout vanuit SSH stdout:', result.stderr);
        }

    } catch (error) {
        ssh.dispose();
        console.error('Fout tijdens ophalen van node list:', error);
        return res.status(500).json({
            success: false,
            message: error.message + ' Fout tijdens ophalen van de node list'
        });
    }

    try {
        const commandToRun = `
            cd wheeltec_ros2 &&
            source install/setup.bash &&
            ros2 topic list
        `;

        const result = await ssh.execCommand(commandToRun);
        
        if (result.stdout) {
            // 1. Splits de output op nieuwe regels, verwijder witruimtes en filter lege regels eruit
            const activeTopics = result.stdout
                .split('\n')
                .map(topic => topic.trim())
                .filter(topic => topic.length > 0);

            // 2. Zet het om in een Set voor snellere zoekopdrachten
            const activeTopicsSet = new Set(activeTopics);

            // 3. Loop door alle commando's en bijbehorende topics in diagnoseCheck
            for (const groupKey in diagnoseCheck.topics) {
                const topicGroup = diagnoseCheck.topics[groupKey];
                
                // Loop door de werkelijke ROS-topics (bijv. "/cmd_vel", "/scan")
                for (const topicName in topicGroup) {
                    
                    // 4. Update de status afhankelijk van of de topic in de Set voorkomt
                    if (activeTopicsSet.has(topicName)) {
                        diagnoseCheck.topics[groupKey][topicName].status = true;
                    } else {
                        diagnoseCheck.topics[groupKey][topicName].status = false;
                    }
                }
            }
        } else if (result.stderr) {
            console.warn('Waarschuwing of fout vanuit SSH stdout:', result.stderr);
        }
    
    } catch (error) {
        ssh.dispose();
        console.error('Fout tijdens ophalen van topic list:', error);
        return res.status(500).json({
            success: false,
            message: error.message + ' Fout tijdens ophalen van de topic list'
        });
    }

    ssh.dispose();

    return res.json({
        success: true,
        output: diagnoseCheck,
    });

};

export const rebootRobot = async (req, res, next) => {
    const ssh = new NodeSSH();

    const ROBOT_IP = process.env.ROBOT_IP;
    if (!ROBOT_IP) {
        console.error("ROBOT_IP ontbreekt in environment variables!");
        return res.status(500).json({
            success: false,
            message: "ROBOT_IP ontbreekt in environment variables"
        });
    }

    try {
        const privateKeyContent = fs.readFileSync('/home/robotoo/.ssh/id_rsa', 'utf8');

        await ssh.connect({
            host: ROBOT_IP,
            username: 'wheeltec',
            privateKey: privateKeyContent
        });
    } catch (error) {
        console.error('Fout tijdens het maken van de SSH verbinding:', error);
        return res.status(500).json({
            success: false,
            message: 'Fout tijdens maken van de ssh verbinding: ' + error.message 
        });
    }

    try {
        const commandToRun = `sudo reboot`;

        ssh.execCommand(commandToRun).catch((err) => {
            console.log("Verbinding verbroken door reboot (dit is verwacht):", err.message);
        });

        setTimeout(() => {
            ssh.dispose();
        }, 1000);

        return res.status(200).json({
            success: true,
            message: "Robot is aan het herstarten..."
        });

    } catch (error) {
        ssh.dispose();
        console.error('Fout tijdens het versturen van het reboot commando:', error);
        return res.status(500).json({
            success: false,
            message: 'Fout tijdens uitvoeren van reboot: ' + error.message
        });
    }
}

export const shutdownRobot = async (req, res, next) => {
    const ssh = new NodeSSH();

    const ROBOT_IP = process.env.ROBOT_IP;
    if (!ROBOT_IP) {
        console.error("ROBOT_IP ontbreekt in environment variables!");
        return res.status(500).json({
            success: false,
            message: "ROBOT_IP ontbreekt in environment variables"
        });
    }

    try {
        const privateKeyContent = fs.readFileSync('/home/robotoo/.ssh/id_rsa', 'utf8');

        await ssh.connect({
            host: ROBOT_IP,
            username: 'wheeltec',
            privateKey: privateKeyContent
        });
    } catch (error) {
        console.error('Fout tijdens het maken van de SSH verbinding:', error);
        return res.status(500).json({
            success: false,
            message: 'Fout tijdens maken van de ssh verbinding: ' + error.message 
        });
    }

    try {
        const commandToRun = `sudo shutdown`;

        ssh.execCommand(commandToRun).catch((err) => {
            console.log("Verbinding verbroken door reboot (dit is verwacht):", err.message);
        });

        setTimeout(() => {
            ssh.dispose();
        }, 1000);

        return res.status(200).json({
            success: true,
            message: "Robot is aan het afsluiten..."
        });

    } catch (error) {
        ssh.dispose();
        console.error('Fout tijdens het versturen van het reboot commando:', error);
        return res.status(500).json({
            success: false,
            message: 'Fout tijdens uitvoeren van reboot: ' + error.message
        });
    }
}

export const rebootSoftRobot = async (req, res, next) => {
    const ssh = new NodeSSH();

    const ROBOT_IP = process.env.ROBOT_IP;
    if (!ROBOT_IP) {
        console.error("ROBOT_IP ontbreekt in environment variables!");
        return res.status(500).json({
            success: false,
            message: "ROBOT_IP ontbreekt in environment variables"
        });
    }

    try {
        const privateKeyContent = fs.readFileSync('/home/robotoo/.ssh/id_rsa', 'utf8');

        await ssh.connect({
            host: ROBOT_IP,
            username: 'wheeltec',
            privateKey: privateKeyContent
        });
    } catch (error) {
        console.error('Fout tijdens het maken van de SSH verbinding:', error);
        return res.status(500).json({
            success: false,
            message: 'Fout tijdens maken van de ssh verbinding: ' + error.message 
        });
    }

    try {
        // 1. export DISPLAY=:0 toegevoegd voor GUI terminals
        // 2. nohup en achtergrond (&) toegevoegd zodat het SSH proces veilig kan afsluiten
        const commandToRun = `
            export DISPLAY=:0 &&
            export XAUTHORITY=/home/wheeltec/.Xauthority &&
            export DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/$(id -u)/bus &&
            cd wheeltec_ros2 &&
            source install/setup.bash &&
            nohup bash startup_all_v3.sh > /dev/null 2>&1 &
        `;

        // We gebruiken exec in plaats van execCommand voor betere achtergrond-executie in sommige shells
        ssh.execCommand(commandToRun).catch((err) => {
            console.log("Fout genegeerd (achtergrondproces draait):", err.message);
        });

        // 1 seconde wachten is nu veilig omdat het script is losgekoppeld
        setTimeout(() => {
            ssh.dispose();
        }, 1000);

        return res.status(200).json({
            success: true,
            message: "Robot terminals worden opnieuw opgestart..."
        });

    } catch (error) {
        ssh.dispose();
        console.error('Fout tijdens het versturen van het reboot commando:', error);
        return res.status(500).json({
            success: false,
            message: 'Fout tijdens uitvoeren van reboot: ' + error.message
        });
    }
}