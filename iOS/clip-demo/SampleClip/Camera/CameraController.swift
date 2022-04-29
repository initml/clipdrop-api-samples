//
//  CameraController.swift
//  SwiftUI-CameraApp
//
//  Created by Gaspard Rosay on 28.01.20.
//  Copyright © 2020 Gaspard Rosay. All rights reserved.
//

import UIKit
import AVFoundation

class CameraController: NSObject {
  var captureSession: AVCaptureSession?
  var camera: AVCaptureDevice?
  var cameraInput: AVCaptureDeviceInput?
  var previewLayer: AVCaptureVideoPreviewLayer?

  var photoOutput: AVCapturePhotoOutput?
  var photoCaptureCompletionBlock: ((UIImage?, Error?) -> Void)?

  var flashMode: AVCaptureDevice.FlashMode = .off

  enum CameraControllerError: Swift.Error {
    case captureSessionIsMissing
    case inputsAreInvalid
    case noCamerasAvailable
    case unknown
  }

  func pinchToZoom(_ sender: UIPinchGestureRecognizer) {

          guard let device = camera else { return }

          if sender.state == .changed {

              let maxZoomFactor = device.activeFormat.videoMaxZoomFactor
              let pinchVelocityDividerFactor: CGFloat = 5.0

              do {

                  try device.lockForConfiguration()
                  defer { device.unlockForConfiguration() }

                  let desiredZoomFactor = device.videoZoomFactor + atan2(sender.velocity, pinchVelocityDividerFactor)
                print(device.videoZoomFactor)
                device.videoZoomFactor = max(1, min(desiredZoomFactor, maxZoomFactor))

              } catch {
                  print(error)
              }
          }
      }

  func prepare(completionHandler: @escaping (Error?) -> Void) {
    func createCaptureSession() {
      self.captureSession = AVCaptureSession()
    }

    func configureCaptureDevices() throws {
      /*** Test new device discovery
      let deviceDiscoverySession = AVCaptureDevice.DiscoverySession(deviceTypes: [.builtInDualCamera, .builtInUltraWideCamera, .builtInDualWideCamera, .builtInTrueDepthCamera, .builtInTripleCamera, .builtInTelephotoCamera, .builtInWideAngleCamera], mediaType: AVMediaType.video, position: .back)


      let devices = deviceDiscoverySession.devices

      guard !devices.isEmpty else {
        AnalyticsManager.shared.logEvent(event: .cameraFailed, parameter: nil)
        throw CameraControllerError.noCamerasAvailable
        //fatalError("Missing capture devices.")
      }

      self.camera = devices.first(where: { device in device.position == .back })!
       *****/

//      if let device = AVCaptureDevice.default(.builtInTripleCamera,
//                                              for: .video, position: .back) {
//        self.camera = device
//      } else

      if let device = AVCaptureDevice.default(.builtInDualCamera,
                                                     for: .video, position: .back) {
        self.camera = device
      } else if let device = AVCaptureDevice.default(.builtInWideAngleCamera,
                                                     for: .video, position: .back) {
        self.camera = device
      } else {
         // throw CameraControllerError.noCamerasAvailable
          fatalError("Missing expected back camera device.")
      }

      try self.camera?.lockForConfiguration()
      self.camera?.unlockForConfiguration()

    }

    func configureDeviceInputs() throws {
      guard let captureSession = self.captureSession else { throw CameraControllerError.captureSessionIsMissing }

      if let backCamera = self.camera {
        self.cameraInput = try AVCaptureDeviceInput(device: backCamera)

        if captureSession.canAddInput(self.cameraInput!) { captureSession.addInput(self.cameraInput!)} else { throw CameraControllerError.inputsAreInvalid }

      } else { throw CameraControllerError.noCamerasAvailable }

      if captureSession.canSetSessionPreset(.photo) {
        captureSession.sessionPreset = .photo
      }
      captureSession.automaticallyConfiguresCaptureDeviceForWideColor = true

      captureSession.commitConfiguration()

      captureSession.startRunning()

    }

    func configurePhotoOutput() throws {
      guard let captureSession = self.captureSession else { throw CameraControllerError.captureSessionIsMissing }

      self.photoOutput = AVCapturePhotoOutput()
      self.photoOutput!.setPreparedPhotoSettingsArray([AVCapturePhotoSettings(format: [AVVideoCodecKey: AVVideoCodecType.jpeg])], completionHandler: nil)

      if captureSession.canAddOutput(self.photoOutput!) { captureSession.addOutput(self.photoOutput!) }

      captureSession.automaticallyConfiguresCaptureDeviceForWideColor = true
      captureSession.startRunning()
    }

    DispatchQueue(label: "prepare").async {
      do {
        createCaptureSession()
        try configureCaptureDevices()
        try configureDeviceInputs()
        try configurePhotoOutput()

      } catch {
        DispatchQueue.main.async {
          completionHandler(error)
        }

        return
      }

      DispatchQueue.main.async {
        completionHandler(nil)
      }
    }
  }

  func displayPreview(on view: UIView) throws {
    guard let captureSession = self.captureSession, captureSession.isRunning else { throw CameraControllerError.captureSessionIsMissing }

    self.previewLayer = AVCaptureVideoPreviewLayer(session: captureSession)
    //self.previewLayer?.videoGravity = AVLayerVideoGravity.resizeAspect
    self.previewLayer?.videoGravity = .resizeAspectFill

    self.previewLayer?.connection?.videoOrientation = .portrait

    view.layer.insertSublayer(self.previewLayer!, at: 0)

    self.previewLayer?.frame = view.frame
  }

  func captureImage(completion: @escaping (UIImage?, Error?) -> Void) {
    guard let captureSession = captureSession, captureSession.isRunning else { completion(nil, CameraControllerError.captureSessionIsMissing); return }

    let settings = AVCapturePhotoSettings()
    settings.flashMode = .off

    if let cam = camera, cam.hasFlash {
      settings.flashMode = self.flashMode
    }

    self.photoOutput?.capturePhoto(with: settings, delegate: self)
    self.photoCaptureCompletionBlock = completion
  }

}

extension CameraController: AVCapturePhotoCaptureDelegate {
  public func photoOutput(_ captureOutput: AVCapturePhotoOutput, didFinishProcessingPhoto photoSampleBuffer: CMSampleBuffer?, previewPhoto previewPhotoSampleBuffer: CMSampleBuffer?,
                          resolvedSettings: AVCaptureResolvedPhotoSettings, bracketSettings: AVCaptureBracketedStillImageSettings?, error: Swift.Error?) {
    if let error = error { self.photoCaptureCompletionBlock?(nil, error) } else if let buffer = photoSampleBuffer, let data = AVCapturePhotoOutput.jpegPhotoDataRepresentation(forJPEGSampleBuffer: buffer, previewPhotoSampleBuffer: nil),
            let image = UIImage(data: data) {

      self.photoCaptureCompletionBlock?(image, nil)
    } else {
      self.photoCaptureCompletionBlock?(nil, CameraControllerError.unknown)
    }
  }
}

