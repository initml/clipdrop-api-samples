/*
See LICENSE folder for this sample’s licensing information.

Abstract:
The camera view shows the feed from the camera, and renders the points
     returned from VNDetectHumanHandpose observations.
*/

import UIKit
import AVFoundation

class CameraView: UIView {

    private var overlayThumbLayer = CAShapeLayer()
    private var overlayIndexLayer = CAShapeLayer()
    private var overlayMiddleLayer = CAShapeLayer()
    private var overlayRingLayer = CAShapeLayer()
    private var overlayLittleLayer = CAShapeLayer()
    private var overlayROILayer = CAShapeLayer()
    private var overlayPointerLayer = CAShapeLayer()

    var previewLayer: AVCaptureVideoPreviewLayer {
        return layer as! AVCaptureVideoPreviewLayer
    }

    override class var layerClass: AnyClass {
        return AVCaptureVideoPreviewLayer.self
    }
    
    override init(frame: CGRect) {
        super.init(frame: frame)
        setupOverlay()
    }
    
    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setupOverlay()
    }
    
    override func layoutSublayers(of layer: CALayer) {
        super.layoutSublayers(of: layer)
        if layer == previewLayer {
            overlayThumbLayer.frame = layer.bounds
            overlayIndexLayer.frame = layer.bounds
            overlayMiddleLayer.frame = layer.bounds
            overlayRingLayer.frame = layer.bounds
            overlayLittleLayer.frame = layer.bounds
            overlayROILayer.frame = layer.bounds
            overlayPointerLayer.frame = layer.bounds
        }
    }

    private func setupOverlay() {
        previewLayer.addSublayer(overlayThumbLayer)
        previewLayer.addSublayer(overlayIndexLayer)
        previewLayer.addSublayer(overlayMiddleLayer)
        previewLayer.addSublayer(overlayRingLayer)
        previewLayer.addSublayer(overlayLittleLayer)
        previewLayer.addSublayer(overlayROILayer)
        previewLayer.addSublayer(overlayPointerLayer)
    }
    
    func showPoints(_ points: [CGPoint]) {
        
        guard let wrist: CGPoint = points.last else {
            // Clear all CALayers
            clearLayers()
            return
        }
        
        let thumbColor = UIColor.green
        let indexColor = UIColor.blue
        let middleColor = UIColor.yellow
        let ringColor = UIColor.cyan
        let littleColor = UIColor.red
        
        drawFinger(overlayThumbLayer, Array(points[0...4]), thumbColor, wrist)
        drawFinger(overlayIndexLayer, Array(points[4...8]), indexColor, wrist)
        drawFinger(overlayMiddleLayer, Array(points[8...12]), middleColor, wrist)
        drawFinger(overlayRingLayer, Array(points[12...16]), ringColor, wrist)
        drawFinger(overlayLittleLayer, Array(points[16...20]), littleColor, wrist)
    }
    
    func midPoint( _ l: CGPoint, _ r: CGPoint ) -> CGPoint {
        return CGPoint( x: ( l.x + r.x ) / 2, y: ( l.y + r.y ) / 2 )
    }
    
    func drawROI(_ roiPoints: [CGPoint]) {
        let path = UIBezierPath()
        var start = CGPoint( x: 0, y: 0 )
        var prev = CGPoint( x: 0, y: 0 )
        for (index, point) in roiPoints.enumerated() {
            switch index {
                case  0:
                    start = point
                case  1:
                    path.move( to: midPoint( start, point ) )
                    prev = point
                default:
                    path.addQuadCurve( to: midPoint( prev, point ), controlPoint: prev )
                    prev = point
            }
        }
        
        overlayROILayer.shadowColor = UIColor.white.cgColor
        overlayROILayer.shadowRadius = 8.0
        overlayROILayer.shadowOpacity = 0.9
        overlayROILayer.shadowOffset = CGSize(width: 0, height: 0)
        
        overlayROILayer.fillColor = UIColor.white.withAlphaComponent(0.2).cgColor
        overlayROILayer.strokeColor = UIColor.white.cgColor
        overlayROILayer.lineWidth = 8.0
        overlayROILayer.lineCap = .round
        CATransaction.begin()
        CATransaction.setDisableActions(true)
        overlayROILayer.path = path.cgPath
        CATransaction.commit()
        
        let circle = UIBezierPath()
        overlayPointerLayer.fillColor = UIColor.white.cgColor
        if (!roiPoints.isEmpty) {
            circle.addArc(withCenter: roiPoints.last!, radius: 12, startAngle: 0, endAngle: 2 * .pi, clockwise: true)
        }
        CATransaction.begin()
        CATransaction.setDisableActions(true)
        overlayPointerLayer.path = circle.cgPath
        CATransaction.commit()
    }
    
    func pulse() {
        let colorAnimation = CABasicAnimation()
        colorAnimation.keyPath = #keyPath(CAShapeLayer.fillColor)
        colorAnimation.fromValue = UIColor.white.cgColor
        colorAnimation.toValue = UIColor.white.withAlphaComponent(0.2).cgColor
        colorAnimation.duration = 0.3
        colorAnimation.fillMode = .forwards
        overlayROILayer.add(colorAnimation, forKey: "fillColor")
    }
    
    func drawFinger(_ layer: CAShapeLayer, _ points: [CGPoint], _ color: UIColor, _ wrist: CGPoint) {
        let fingerPath = UIBezierPath()
        
        for point in points {
            fingerPath.move(to: point)
            fingerPath.addArc(withCenter: point, radius: 5, startAngle: 0, endAngle: 2 * .pi, clockwise: true)
        }
        
        fingerPath.move(to: points[0])
        fingerPath.addLine(to: points[1])
        fingerPath.move(to: points[1])
        fingerPath.addLine(to: points[2])
        fingerPath.move(to: points[2])
        fingerPath.addLine(to: points[3])
        fingerPath.move(to: points[3])
        fingerPath.addLine(to: wrist)
        
        layer.fillColor = color.cgColor
        layer.strokeColor = color.cgColor
        layer.lineWidth = 5.0
        layer.lineCap = .round
        CATransaction.begin()
        CATransaction.setDisableActions(true)
        layer.path = fingerPath.cgPath
        CATransaction.commit()
    }
    
    func clearLayers() {
        let emptyPath = UIBezierPath()
        CATransaction.begin()
        CATransaction.setDisableActions(true)
        overlayThumbLayer.path = emptyPath.cgPath
        overlayIndexLayer.path = emptyPath.cgPath
        overlayMiddleLayer.path = emptyPath.cgPath
        overlayRingLayer.path = emptyPath.cgPath
        overlayLittleLayer.path = emptyPath.cgPath
        CATransaction.commit()
    }
}
