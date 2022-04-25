//
//  CameraViewController.swift
//  SwiftUI-CameraApp
//
//  Created by Gaspard Rosay on 28.01.20.
//  Copyright © 2020 Gaspard Rosay. All rights reserved.
//

import UIKit
import SwiftUI
import Photos
import MediaPlayer

final class CameraViewController: UIViewController {

  let cameraController = CameraController()
  var previewView: UIView!
 // var volume: Float = 0.5

  func addCapturePhotoObserver() {
    NotificationCenter.default.addObserver(self, selector: #selector(capturePhotoObjc), name: Notification.Name("capturePhoto"), object: nil)
  }

  @objc func capturePhotoObjc() {
    capturePhoto()
  }

  func addPinchToZoom() {
    let pinchToZoom = UIPinchGestureRecognizer(target: self, action: #selector(didPinchToZoom(_:)))

    previewView.addGestureRecognizer(pinchToZoom)
  }

  @objc func didPinchToZoom(_ recognizer: UIPinchGestureRecognizer) {
    cameraController.pinchToZoom(recognizer)
  }

  func capturePhoto() {
    cameraController.captureImage {(image, error) in
      guard let image = image else {
        print(error ?? "Image capture error")
        return
      }

      NotificationCenter.default.post(name: Notification.Name(rawValue: "imageCaptured"), object: image)

    }
  }

  deinit {
    NotificationCenter.default.removeObserver(self, name: Notification.Name("capturePhoto"), object: nil)
  }

  override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
      let touchPoint = touches.first! as UITouch
      let screenSize = previewView.bounds.size
      let focusPoint = CGPoint(x: touchPoint.location(in: previewView).y / screenSize.height, y: 1.0 - touchPoint.location(in: previewView).x / screenSize.width)

    if let device = cameraController.camera {
          do {
              try device.lockForConfiguration()
              if device.isFocusPointOfInterestSupported {
                  device.focusPointOfInterest = focusPoint
                device.focusMode = AVCaptureDevice.FocusMode.autoFocus
              }
              if device.isExposurePointOfInterestSupported {
                  device.exposurePointOfInterest = focusPoint
                device.exposureMode = AVCaptureDevice.ExposureMode.autoExpose
              }
              device.unlockForConfiguration()

          } catch {
              // FIXME: Handle errors here
          }
      }
  }

  override func viewDidLoad() {

    previewView = UIView(frame: CGRect(x: 0, y: 0, width: UIScreen.main.bounds.size.width, height: UIScreen.main.bounds.size.height))
    previewView.contentMode = UIView.ContentMode.scaleAspectFill
    view.addSubview(previewView)

    addCapturePhotoObserver()
    addPinchToZoom()
    launchCameraDisplay()

  }

  func launchCameraDisplay() {
    cameraController.prepare {(error) in
      if let error = error {
        print(error)
      }

      try? self.cameraController.displayPreview(on: self.previewView)
    }
  }

  @objc func takePhoto() {
    capturePhoto()
  }
}

extension CameraViewController: UIViewControllerRepresentable {

  public typealias UIViewControllerType = CameraViewController

  public func makeUIViewController(context: UIViewControllerRepresentableContext<CameraViewController>) -> CameraViewController {
    CameraViewController()
  }

  public func updateUIViewController(_ uiViewController: CameraViewController, context: UIViewControllerRepresentableContext<CameraViewController>) {}
}

