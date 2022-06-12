//
//  UIImage+extension.swift
//  iOS-Vision-HandPose
//
//  Created by Romain Boyer on 15/04/2022.
//

import Foundation
import UIKit

extension UIImage {
    
    /// Extension to fix orientation of an UIImage without EXIF
    func fixOrientation() -> UIImage {

        guard let cgImage = cgImage else { return self }

        if imageOrientation == .up { return self }

        var transform = CGAffineTransform.identity

        switch imageOrientation {

            case .down, .downMirrored:
                transform = transform.translatedBy(x: size.width, y: size.height)
                transform = transform.rotated(by: CGFloat(Double.pi))

            case .left, .leftMirrored:
                transform = transform.translatedBy(x: size.width, y: 0)
                transform = transform.rotated(by: CGFloat(Double.pi / 2))

            case .right, .rightMirrored:
                transform = transform.translatedBy(x: 0, y: size.height)
                transform = transform.rotated(by: CGFloat(-(Double.pi / 2)))

            case .up, .upMirrored:
                break
                
            default:
                break
        }

        switch imageOrientation {

            case .upMirrored, .downMirrored:
                transform.translatedBy(x: size.width, y: 0)
                transform.scaledBy(x: -1, y: 1)

            case .leftMirrored, .rightMirrored:
                transform.translatedBy(x: size.height, y: 0)
                transform.scaledBy(x: -1, y: 1)

            case .up, .down, .left, .right:
                break
                
            default:
                break
        }

        if let ctx = CGContext(data: nil, width: Int(size.width), height: Int(size.height), bitsPerComponent: cgImage.bitsPerComponent, bytesPerRow: 0, space: cgImage.colorSpace!, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) {

            ctx.concatenate(transform)

            switch imageOrientation {

            case .left, .leftMirrored, .right, .rightMirrored:
                ctx.draw(cgImage, in: CGRect(x: 0, y: 0, width: size.height, height: size.width))

            default:
                ctx.draw(cgImage, in: CGRect(x: 0, y: 0, width: size.width, height: size.height))
            }

            if let finalImage = ctx.makeImage() {
                return (UIImage(cgImage: finalImage))
            }
        }

        // something failed -- return original
        return self
    }

}
