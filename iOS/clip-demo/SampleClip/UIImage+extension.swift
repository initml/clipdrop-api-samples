//
//  UIImage+extension.swift
//  SampleClip
//
//  Created by Romain Boyer on 15/04/2022.
//

import Foundation
import UIKit

extension UIImage {
  func resizeToResolution(resolution: CGFloat) -> UIImage? {

    if size.width > size.height {
      let imageView = UIImageView(frame: CGRect(origin: .zero, size: CGSize(width: resolution, height: CGFloat(ceil(resolution/size.width * size.height)))))
      imageView.contentMode = .scaleAspectFit
      imageView.image = self
      UIGraphicsBeginImageContextWithOptions(imageView.bounds.size, false, scale)
      guard let context = UIGraphicsGetCurrentContext() else {
        return nil
      }
      imageView.layer.render(in: context)
      guard let result = UIGraphicsGetImageFromCurrentImageContext() else {
        return nil
      }
      UIGraphicsEndImageContext()
      return result

    } else {
      let imageView = UIImageView(frame: CGRect(origin: .zero, size: CGSize(width: CGFloat(ceil(size.width * resolution/size.height)), height: resolution)))
      imageView.contentMode = .scaleAspectFit
      imageView.image = self
      UIGraphicsBeginImageContextWithOptions(imageView.bounds.size, false, scale)
      guard let context = UIGraphicsGetCurrentContext()else {
        return nil
      }
      imageView.layer.render(in: context)
      guard let result = UIGraphicsGetImageFromCurrentImageContext() else {
        return nil
      }
      UIGraphicsEndImageContext()
      return result
    }
  }

}
