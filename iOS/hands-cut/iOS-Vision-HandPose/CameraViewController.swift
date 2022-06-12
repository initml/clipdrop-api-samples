/*
See LICENSE folder for this sample’s licensing information.

Abstract:
The app's main view controller object.
*/

import UIKit
import AVFoundation
import Vision
import Alamofire
import LinkPresentation

// Set your ClipDrop API Key here
var CLIPDROP_API_KEY = ""

class CameraViewController: UIViewController, UIActivityItemSource {

    private var cameraView: CameraView { view as! CameraView }
    
    private let videoDataOutputQueue = DispatchQueue(label: "CameraFeedDataOutput", qos: .userInteractive)
    private var cameraFeedSession: AVCaptureSession?
    private var handPoseRequest = VNDetectHumanHandPoseRequest()
    private var roiPoints = [CGPoint()]
    private var isGestureLasso = false
    private var isGestureCrab = false
    private var photoOutput: AVCapturePhotoOutput?
    private var photoCaptureCompletionBlock: ((UIImage?, Error?) -> Void)?
    private var image: UIImage?
    private var captureLock = false
    private var resultView: UIImageView?
    private var button: UIButton = UIButton()
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        let tap = UITapGestureRecognizer(target: self, action: #selector(doubleTapped))
        tap.numberOfTapsRequired = 2
        view.addGestureRecognizer(tap)
        
        // This sample app detects one hand only.
        handPoseRequest.maximumHandCount = 1
        
        // Initialize the button
        let margin = 60.0
        let height = 120.0
        let frame = CGRect(
            x: margin,
            y: UIScreen.main.bounds.height - height - 120,
            width: UIScreen.main.bounds.width - margin * 2,
            height: height
        )
        button.layer.cornerRadius = 30
        button.clipsToBounds = true
        button.setTitle("Export", for: .normal)
        button.frame = frame
        button.addTarget(self, action:#selector(self.shareImage), for: .touchUpInside)
        button.setBackgroundColor(color: .white.withAlphaComponent(0.25), forState: .normal)
        button.setBackgroundColor(color: .white, forState: .highlighted)
        button.setTitleColor(UIColor.white, for: .normal)
        button.setTitleColor(UIColor.black, for: .highlighted)
        button.titleLabel!.font = UIFont.systemFont(ofSize: 18, weight: .bold)
        button.addBlurEffect()
        
        button.alpha = 0
    }
    
    @IBAction func shareImage(_ sender: UIButton) {
        print("SHARE")
        if self.image == nil {
            print("NO IMAGE")
            return
        }
        let activityViewController = UIActivityViewController(activityItems: [ self.image!, self ] , applicationActivities: nil)
        activityViewController.popoverPresentationController?.sourceView = self.view
        self.present(activityViewController, animated: true, completion: nil)
     }
    
    func activityViewControllerPlaceholderItem(_ activityViewController: UIActivityViewController) -> Any {
        return ""
    }

    func activityViewController(_ activityViewController: UIActivityViewController, itemForActivityType activityType: UIActivity.ActivityType?) -> Any? {
        return nil
    }

    func activityViewControllerLinkMetadata(_ activityViewController: UIActivityViewController) -> LPLinkMetadata? {
        if self.image == nil {
            print("NO IMAGE")
            return nil
        }
        let imageProvider = NSItemProvider(object: self.image!)
        let metadata = LPLinkMetadata()
        metadata.imageProvider = imageProvider
        return metadata
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        do {
            if cameraFeedSession == nil {
                cameraView.previewLayer.videoGravity = .resizeAspectFill
                try setupAVSession()
                cameraView.previewLayer.session = cameraFeedSession
                
                self.cameraView.addSubview(self.button)
            }
            cameraFeedSession?.startRunning()
        } catch {
            AppError.display(error, inViewController: self)
        }
    }
    
    override func viewWillDisappear(_ animated: Bool) {
        cameraFeedSession?.stopRunning()
        super.viewWillDisappear(animated)
    }
    
    func setupAVSession() throws {
        // Select a front facing camera, make an input.
        guard let videoDevice = AVCaptureDevice.default(.builtInUltraWideCamera, for: .video, position: .back) else {
            throw AppError.captureSessionSetup(reason: "Could not find a back facing camera.")
        }
        
        guard let deviceInput = try? AVCaptureDeviceInput(device: videoDevice) else {
            throw AppError.captureSessionSetup(reason: "Could not create video device input.")
        }
        
        let session = AVCaptureSession()
        session.beginConfiguration()
        session.sessionPreset = AVCaptureSession.Preset.high
        
        // Add a video input.
        guard session.canAddInput(deviceInput) else {
            throw AppError.captureSessionSetup(reason: "Could not add video device input to the session")
        }
        session.addInput(deviceInput)
        
        let dataOutput = AVCaptureVideoDataOutput()
        if session.canAddOutput(dataOutput) {
            session.addOutput(dataOutput)
            // Add a video data output.
            dataOutput.alwaysDiscardsLateVideoFrames = true
            dataOutput.videoSettings = [kCVPixelBufferPixelFormatTypeKey as String: Int(kCVPixelFormatType_420YpCbCr8BiPlanarFullRange)]
            dataOutput.setSampleBufferDelegate(self, queue: videoDataOutputQueue)
        } else {
            throw AppError.captureSessionSetup(reason: "Could not add video data output to the session")
        }
        
        self.photoOutput = AVCapturePhotoOutput()
        self.photoOutput!.setPreparedPhotoSettingsArray([AVCapturePhotoSettings(format: [AVVideoCodecKey: AVVideoCodecType.jpeg])], completionHandler: nil)
        session.addOutput(self.photoOutput!)

        session.commitConfiguration()
        cameraFeedSession = session
    }
    
    func captureImage(completion: @escaping (UIImage?, Error?) -> Void) {
        let settings = AVCapturePhotoSettings()
        self.photoOutput?.capturePhoto(with: settings, delegate: self)
        self.photoCaptureCompletionBlock = completion
    }
    
    func getBoundingBox(pts:[CGPoint]) -> CGRect {
        let path = CGMutablePath()
        path.move(to: pts[0])
        for pt in pts { path.addLine(to: pt) }
        return path.boundingBox
    }
    
    func resetResultPosition() {
        if let resultView = self.resultView {
            UIView.animate(withDuration: 0.5) {
                resultView.frame = CGRect(
                    x: (self.cameraView.bounds.width - resultView.bounds.width) * 0.5,
                    y: self.cameraView.bounds.height * 0.1,
                    width: resultView.bounds.width,
                    height: resultView.bounds.height
                )
            }
        }
    }
    
    func processPoints(_ points: [CGPoint?]) {
        // Convert points from AVFoundation coordinates to UIKit coordinates.
        let previewLayer = cameraView.previewLayer
        var pointsConverted: [CGPoint] = []
        for point in points {
            pointsConverted.append(previewLayer.layerPointConverted(fromCaptureDevicePoint: point!))
        }
        
        // If we already have an image we drag it around with the crab gesture
        if (self.image != nil) {
            if !isGestureCrab {
                resetResultPosition()
                return
            }
            if let resultView = self.resultView {
                let x = pointsConverted[1].x
                let y = pointsConverted[1].y
                if self.button.frame.contains(CGPoint(x: x, y: y)) {
                    self.button.isHighlighted = true
                    shareImage(self.button)
                } else {
                    self.button.isHighlighted = false
                }
                UIView.animate(withDuration: 0.1) {
                    resultView.center = CGPoint(x: x, y: y)
                }
            }
        }
        else if (!captureLock) {
            
            if !isGestureLasso {
                return
            }
            
            // Append new index tip to ROI
            let indexTipIndex = 1
            roiPoints.append(pointsConverted[indexTipIndex])
            
            // Get distance between first and last point
            var d = 9999.0
            if let first = roiPoints.first, let last = roiPoints.last {
                let dx = first.x - last.x
                let dy = first.y - last.y
                d = dx * dx + dy * dy
            }
            
            // Take the photo if all the conditions are met
            if (!captureLock && roiPoints.count > 20  && d < 750) {
                cameraView.pulse()
                captureLock = true
                captureImage {(image, error) in
                    guard let image = image else {
                        print(error ?? "Image capture error")
                        return
                    }
                    print("CAPTURE")
                    // Get the bounding box relative to the screen.
                    let rect = self.getBoundingBox(pts:self.roiPoints)
                    // Normalize the bounding box.
                    var x = rect.minX / previewLayer.bounds.width
                    var y = rect.minY / previewLayer.bounds.height
                    var w = rect.width / previewLayer.bounds.width
                    var h = rect.height / previewLayer.bounds.height
                    // Transpose the bounding box from screen-space to photo-space (the photo & screen don't have the same size & ratio).
                    let screenRatio = previewLayer.bounds.width / previewLayer.bounds.height
                    
                    let imageRatio = image.size.width / image.size.height
                    if imageRatio > screenRatio { // The photo is wider than the screen (most likely scenario)
                        // x = (x + (r2-r1)/r1 * 0.5) * r1/r2
                        x = (x + (imageRatio - screenRatio) / screenRatio * 0.5) * (screenRatio / imageRatio)
                        w *= (screenRatio / imageRatio)
                    } else {
                        y = (y + (imageRatio - screenRatio) / screenRatio * 0.5) * (screenRatio / imageRatio)
                        h *= (screenRatio / imageRatio)
                    }
                    
                    // Crop the image with these bounds.
                    let origin = CGPoint(x: x * image.size.width, y: y * image.size.height)
                    let size = CGSize(width: w * image.size.width, height: h * image.size.height)
                    let scaledRect = CGRect(origin: origin, size: size)
                    
                    let rotated = image.fixOrientation()
                    
                    guard let cgim = rotated.cgImage else {
                        print(error ?? "Could not retrieve cg image")
                        return
                    }
                    guard let imageRef = cgim.cropping(to: scaledRect) else {
                        print(error ?? "Could not crop")
                        return
                    }
                    let cropped:UIImage = UIImage(cgImage:imageRef)
                    print("Cropped size", cropped.size)
                    
                    self.removeBackground(image: cropped, rect:rect)
                }
            }
            
            // Draw the ROI
            cameraView.drawROI(roiPoints)
        }
        
    }
    
    
    
    func removeBackground(image: UIImage, rect:CGRect) {
        let imageData = image.jpegData(compressionQuality: 0.9)!
        let headers: HTTPHeaders = [
            "x-api-key": CLIPDROP_API_KEY
        ]

        AF.upload(
        multipartFormData: { multipartFormData in
            multipartFormData.append(
                imageData,
                withName: "image_file",
                fileName: "object.jpg",
                mimeType: "image/jpeg"
            )
        },
        to:"https://apis.clipdrop.co/remove-background/v1",
        headers: headers
        )
        .validate()
        .responseData(queue: .global()) { response in

        Task { @MainActor in
            switch response.result {
                case .success: do {
                    if let dataSafe = response.data, let imageReceived = UIImage.init(data: dataSafe) {
                        print("Done")
                        self.image = imageReceived
                        
                        let resultView = UIImageView(image:imageReceived)
//                        let rect = self.getBoundingBox(pts:self.roiPoints)
                        resultView.contentMode = UIView.ContentMode.scaleToFill
                        resultView.frame = CGRect(x: rect.minX, y: rect.minY, width: rect.width, height: rect.height)
                        self.cameraView.addSubview(resultView)
                        self.cameraView.drawROI([])
                        self.resultView = resultView
                        
                        // Display
                        self.resetResultPosition()
                        UIView.animate(withDuration: 0.5) {
                            self.button.alpha = 1
                        }
                    } else {
                        print("Data not processable")
                        if let dataSafe = response.data {
                            print(dataSafe)
                        }
                    }
                }
                case let .failure(error):
                    print(error)
                    if let dataSafe = response.data {
                        print(dataSafe)
                    }
                }
            }
        }
    }
    
    func clear() {
        self.roiPoints = []
        self.resultView?.removeFromSuperview()
        self.captureLock = false
        self.image = nil
        cameraView.drawROI(self.roiPoints)
        cameraView.showPoints([])
        self.button.alpha = 0
    }
    
    @objc func doubleTapped() {
        self.clear()
    }
}

extension CameraViewController: AVCaptureVideoDataOutputSampleBufferDelegate {
    public func captureOutput(_ output: AVCaptureOutput, didOutput sampleBuffer: CMSampleBuffer, from connection: AVCaptureConnection) {
        var thumbTip: CGPoint?
        var indexTip: CGPoint?

        let handler = VNImageRequestHandler(cmSampleBuffer: sampleBuffer, orientation: .up, options: [:])
        do {

            try handler.perform([handPoseRequest])
            guard let observation = handPoseRequest.results?.first else {
                DispatchQueue.main.async {
                    if self.image == nil {
                        self.clear()
                    }
                }
                return
            }
            
            // Get points for thumb and index finger.
            let thumbPoints = try observation.recognizedPoints(VNHumanHandPoseObservation.JointsGroupName.thumb)
            let indexFingerPoints = try observation.recognizedPoints(VNHumanHandPoseObservation.JointsGroupName.indexFinger)
            
            // Extract individual points from Point groups.
            guard let thumbTipPoint = thumbPoints[.thumbIP],
                  let indexTipPoint = indexFingerPoints[.indexTip]
            else {
                return
            }
            
            guard indexTipPoint.confidence > 0.1 && thumbTipPoint.confidence > 0.1 else {
                return
            }
            
            let dx = thumbTipPoint.location.x - indexTipPoint.location.x
            let dy = thumbTipPoint.location.y - indexTipPoint.location.y
            let d = dx * dx + dy * dy

            DispatchQueue.main.async {
                self.isGestureLasso = d > 0.02
                self.isGestureCrab = d < 0.01
            }
            
            // Convert points from Vision coordinates to AVFoundation coordinates.
            thumbTip = CGPoint(x: thumbTipPoint.location.x, y: 1 - thumbTipPoint.location.y)
            indexTip = CGPoint(x: indexTipPoint.location.x, y: 1 - indexTipPoint.location.y)
            
            DispatchQueue.main.async {
                self.processPoints([thumbTip, indexTip])
            }
        } catch {
            cameraFeedSession?.stopRunning()
            let error = AppError.visionError(error: error)
            DispatchQueue.main.async {
                error.displayInViewController(self)
            }
        }
    }
}

extension CameraViewController: AVCapturePhotoCaptureDelegate {
    public func photoOutput(_ captureOutput: AVCapturePhotoOutput, didFinishProcessingPhoto photo: AVCapturePhoto, error: Error?) {
        if let error = error {
            self.photoCaptureCompletionBlock?(nil, error)
            return
        }
        let data = photo.fileDataRepresentation()
        let image = UIImage(data: data!)
        self.photoCaptureCompletionBlock?(image, nil)
    }
}


// MARK: - CGPoint helpers

extension CGPoint {

    static func midPoint(p1: CGPoint, p2: CGPoint) -> CGPoint {
        return CGPoint(x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2)
    }
    
    func distance(from point: CGPoint) -> CGFloat {
        return hypot(point.x - x, point.y - y)
    }
}

