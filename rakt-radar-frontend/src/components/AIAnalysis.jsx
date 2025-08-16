import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Loader2, Brain, MapPin, Clock, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';

const AIAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisSteps, setAnalysisSteps] = useState([]);
  const [aiResults, setAiResults] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [bloodRequest, setBloodRequest] = useState({
    blood_type: 'O+',
    quantity_ml: 450,
    urgency: 'high',
    location: 'Mumbai'
  });

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const urgencyLevels = [
    { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800' }
  ];

  const startAIAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisSteps([]);
    setAiResults(null);
    setCurrentStep(0);

    try {
      const response = await fetch('http://localhost:8000/api/ai_blood_request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          blood_type: bloodRequest.blood_type,
          quantity_ml: bloodRequest.quantity_ml,
          urgency: bloodRequest.urgency,
          location: { lat: 19.0760, lng: 72.8777 } // Mumbai coordinates
        })
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        // Simulate step-by-step AI thinking
        for (let i = 0; i < data.analysis_steps.length; i++) {
          setCurrentStep(i);
          setAnalysisSteps(data.analysis_steps.slice(0, i + 1));
          
          // Wait between steps to show AI thinking
          await new Promise(resolve => setTimeout(resolve, 800));
        }
        
        setAiResults(data);
      }
    } catch (error) {
      console.error('AI Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getStepIcon = (step) => {
    switch (step) {
      case 1: return <Brain className="w-5 h-5" />;
      case 2: return <TrendingUp className="w-5 h-5" />;
      case 3: return <AlertCircle className="w-5 h-5" />;
      case 4: return <MapPin className="w-5 h-5" />;
      case 5: return <TrendingUp className="w-5 h-5" />;
      case 6: return <Brain className="w-5 h-5" />;
      case 7: return <CheckCircle className="w-5 h-5" />;
      default: return <Loader2 className="w-5 h-5" />;
    }
  };

  const getStepColor = (step, status) => {
    if (status === 'completed') return 'text-green-600';
    if (step <= currentStep) return 'text-blue-600';
    return 'text-gray-400';
  };

  return (
    <div className="space-y-6">
      {/* Blood Request Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-blue-600" />
            AI Blood Request Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="blood_type">Blood Type Required</Label>
              <Select value={bloodRequest.blood_type} onValueChange={(value) => setBloodRequest({...bloodRequest, blood_type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {bloodTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity (ml)</Label>
              <Input
                id="quantity"
                type="number"
                value={bloodRequest.quantity_ml}
                onChange={(e) => setBloodRequest({...bloodRequest, quantity_ml: parseInt(e.target.value)})}
                placeholder="450"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="urgency">Urgency Level</Label>
              <Select value={bloodRequest.urgency} onValueChange={(value) => setBloodRequest({...bloodRequest, urgency: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {urgencyLevels.map(level => (
                    <SelectItem key={level.value} value={level.value}>
                      <div className="flex items-center gap-2">
                        <Badge className={level.color}>{level.label}</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={bloodRequest.location}
                onChange={(e) => setBloodRequest({...bloodRequest, location: e.target.value})}
                placeholder="Mumbai"
              />
            </div>
          </div>
          
          <Button 
            onClick={startAIAnalysis} 
            disabled={isAnalyzing}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                AI is Analyzing...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4 mr-2" />
                Start AI Analysis
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* AI Analysis Progress */}
      {isAnalyzing && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              AI Analysis in Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analysisSteps.map((step, index) => (
                <div key={step.step} className={`flex items-center gap-3 p-3 rounded-lg border ${
                  step.status === 'completed' ? 'bg-green-50 border-green-200' : 
                  index <= currentStep ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className={`p-2 rounded-full ${
                    step.status === 'completed' ? 'bg-green-100' : 
                    index <= currentStep ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    {getStepIcon(step.step)}
                  </div>
                  
                  <div className="flex-1">
                    <div className={`font-medium ${getStepColor(step.step, step.status)}`}>
                      {step.message}
                    </div>
                    <div className="text-sm text-gray-600">{step.details}</div>
                  </div>
                  
                  <div className="w-20">
                    <Progress value={step.progress} className="h-2" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Results */}
      {aiResults && !isAnalyzing && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
              AI Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Analysis Summary */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
                <div>
                  <div className="text-sm text-gray-600">Units Scanned</div>
                  <div className="text-2xl font-bold text-blue-600">{aiResults.ai_summary.analysis_results.total_units_scanned}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">AI Confidence</div>
                  <div className="text-2xl font-bold text-blue-600">{aiResults.ai_summary.analysis_results.ai_confidence_score.toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Matches Found</div>
                  <div className="text-2xl font-bold text-blue-600">{aiResults.ai_summary.analysis_results.optimal_matches_identified}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Lives Saved</div>
                  <div className="text-2xl font-bold text-blue-600">{aiResults.ai_summary.recommendations.estimated_lives_saved}</div>
                </div>
              </div>

              {/* Top Matches */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Top AI Recommendations</h3>
                <div className="space-y-3">
                  {aiResults.matches.slice(0, 3).map((match, index) => (
                    <div key={match.blood_unit_id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className={index === 0 ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                            Priority {index + 1}
                          </Badge>
                          <Badge className="bg-purple-100 text-purple-800">
                            AI Score: {match.ai_score}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          {match.distance_km}km • {match.estimated_time_hours}h
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Blood Unit:</span> {match.blood_type} ({match.quantity_ml}ml)
                        </div>
                        <div>
                          <span className="font-medium">Expires in:</span> {match.days_until_expiry} days
                        </div>
                        <div>
                          <span className="font-medium">Destination:</span> {match.entity_name}
                        </div>
                        <div>
                          <span className="font-medium">Compatibility:</span> {match.compatibility_score}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Waste Prevention Impact */}
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">Waste Prevention Impact</h4>
                <p className="text-green-700">
                  {aiResults.ai_summary.recommendations.waste_prevention_potential} • 
                  Estimated {aiResults.ai_summary.recommendations.estimated_lives_saved} lives saved
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AIAnalysis;
