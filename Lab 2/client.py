import socket
import json
import pyrealsense2 as rs
import numpy as np
import cv2

################# REALSENSE CONFIG #################

# Configure depth and color streams
pipeline = rs.pipeline()
config = rs.config()

# Get device product line for setting a supporting resolution
pipeline_wrapper = rs.pipeline_wrapper(pipeline)
pipeline_profile = config.resolve(pipeline_wrapper)
device = pipeline_profile.get_device()
device_product_line = str(device.get_info(rs.camera_info.product_line))

found_rgb = False
for s in device.sensors:
    if s.get_info(rs.camera_info.name) == 'RGB Camera':
        found_rgb = True
        break
if not found_rgb:
    print("The demo requires Depth camera with Color sensor")
    exit(0)

config.enable_stream(rs.stream.depth, 640, 480, rs.format.z16, 30)
config.enable_stream(rs.stream.color, 640, 480, rs.format.bgr8, 30)

arucoDict = cv2.aruco.getPredefinedDictionary(cv2.aruco.DICT_6X6_250)
arucoParams = cv2.aruco.DetectorParameters()
arucoDetector = cv2.aruco.ArucoDetector(arucoDict, arucoParams)

# Start streaming
pipeline.start(config)
printed = False

####################################################

HOST = "192.168.1.120"  # csie523
# HOST = "127.0.0.1"      # localhost
PORT = 14514

def receive(sock):
    data = sock.recv(2048)
    data = data.decode('utf-8')
    msg = json.loads(data)
    return msg["messages"]

def send(sock, msg):
    data = json.dumps(msg)
    sock.sendall(data.encode('utf-8'))
    print("Sent: ", msg)

def centroid(vertices):
    x, y = 0, 0
    n = len(vertices)
    signed_area = 0
    for i in range(len(vertices)):
        x0, y0 = vertices[i]
        x1, y1 = vertices[(i + 1) % n]
        # shoelace formula
        area = (x0 * y1) - (x1 * y0)
        signed_area += area
        x += (x0 + x1) * area
        y += (y0 + y1) * area
    signed_area *= 0.5
    x /= 6 * signed_area
    y /= 6 * signed_area
    return int(x), int(y)

def find_transformation_matrix(realsense_points, unity_points):
    N = realsense_points.shape[0]

    # Prepare the design matrix A and the observation vector B
    A = np.zeros((N * 3, 12))
    B = np.zeros(N * 3)

    for i in range(N):
        x_r, y_r, z_r = realsense_points[i]
        x_u, y_u, z_u = unity_points[i]

        # Equation for x_u
        A[3 * i] = [x_r, y_r, z_r, 1, 0, 0, 0, 0, 0, 0, 0, 0]
        B[3 * i] = x_u

        # Equation for y_u
        A[3 * i + 1] = [0, 0, 0, 0, x_r, y_r, z_r, 1, 0, 0, 0, 0]
        B[3 * i + 1] = y_u

        # Equation for z_u
        A[3 * i + 2] = [0, 0, 0, 0, 0, 0, 0, 0, x_r, y_r, z_r, 1]
        B[3 * i + 2] = z_u

    # Solve the linear system A * p = B
    # p contains the elements of the transformation matrix T
    p, _, _, _ = np.linalg.lstsq(A, B, rcond=None)

    # Construct the transformation matrix T
    T = np.zeros((4, 4))
    T[0, :] = [p[0], p[1], p[2], p[3]]
    T[1, :] = [p[4], p[5], p[6], p[7]]
    T[2, :] = [p[8], p[9], p[10], p[11]]
    T[3, :] = [0, 0, 0, 1]  # Homogeneous coordinate
    print(T)
    return T
    
T = None
unity_anchors = {}
detected_ids = []
calibrated = False


with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
    sock.connect((HOST, PORT))
    print("Connected to server")
    while True:
        try:
            msgs = receive(sock)
            print("********************************************")
            # decomposite msg
            for msg in msgs:
                unity_anchors[msg["id"]] =  msg["position"]

            if sorted(list(unity_anchors.keys())) != [1, 2, 3, 4, 5, 6]:
                continue

            unity_coordinates = [list(coor.values()) for coor in unity_anchors.values()]
            unity_coordinates = np.array(unity_coordinates)

            # capture marker
            frames = pipeline.wait_for_frames()
            depth_frame = frames.get_depth_frame()
            color_frame = frames.get_color_frame()
            if not depth_frame or not color_frame:
                continue
            depth_intrinsics = depth_frame.profile.as_video_stream_profile().intrinsics
            
            depth_image = np.asanyarray(depth_frame.get_data())
            color_image = np.asanyarray(color_frame.get_data())

            corners, ids, rejected = arucoDetector.detectMarkers(color_image)
            
            # show image
            color_image = cv2.aruco.drawDetectedMarkers(color_image, corners, ids)
            depth_colormap = cv2.applyColorMap(cv2.convertScaleAbs(depth_image, alpha=0.03), cv2.COLORMAP_JET)

            depth_colormap_dim = depth_colormap.shape
            color_colormap_dim = color_image.shape

            if depth_colormap_dim != color_colormap_dim:
                resized_color_image = cv2.resize(color_image, dsize=(depth_colormap_dim[1], depth_colormap_dim[0]), interpolation=cv2.INTER_AREA)
                images = np.hstack((resized_color_image, depth_colormap))
            else:
                images = np.hstack((color_image, depth_colormap))

            cv2.namedWindow('RealSense', cv2.WINDOW_AUTOSIZE)
            cv2.imshow('RealSense', images)
            cv2.waitKey(1)
            
            # read markers
            realsense_coordinates = {}

            for i in range(len(corners)):
                x, y = centroid(corners[i][0])
                depth = depth_frame.get_distance(x, y)
                realsense_coordinates[int(ids[i][0])] = rs.rs2_deproject_pixel_to_point(depth_intrinsics, [x, y], depth)

            # calibrate
            if not calibrated:
                calibration_coordinates = {key: realsense_coordinates[key] for key in [1, 2, 3, 4, 5, 6] if key in realsense_coordinates}

                if len(calibration_coordinates) < 6:
                    print("Calibration failed: Not enough code.")
                    continue

                if any(all(x == 0.0 for x in coordinate) for coordinate in calibration_coordinates.values()):
                    print("Calibration failed: Invalid code coordinate.")
                    continue

                calibration_coordinates = dict(sorted(calibration_coordinates.items()))
                calibration_coordinates = np.array(list(calibration_coordinates.values()))
                T = find_transformation_matrix(calibration_coordinates, unity_coordinates)
                calibrated = True
                print("Calibration done.")
            
            # send new markers with new coordinates
            out_messages = {'messages': []}

            for id, coordinate in realsense_coordinates.items():
                if (id in [1, 2, 3, 4, 5, 6]) or (id in detected_ids) or all(x == 0.0 for x in coordinate):
                    continue
                coordinate.append(1)
                anchor_realsense_coordinate = np.array(coordinate)
                anchor_unity_coordinate = np.matmul(T, anchor_realsense_coordinate)
                x, y, z = anchor_unity_coordinate[:-1].tolist()
                print("Realsense Data:", id, coordinate)
                out_messages['messages'].append({'id': id, 'position': {'x': x, 'y': y, 'z': z}})
                detected_ids.append(id)

            send(sock, out_messages)

        except KeyboardInterrupt:
            exit()

        except:
            pass

pipeline.stop()