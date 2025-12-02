import Example from '../models/example.js';

// 예시 컨트롤러 함수들
export const getExamples = async (req, res) => {
  try {
    const examples = await Example.find();
    res.json(examples);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createExample = async (req, res) => {
  try {
    const example = new Example(req.body);
    const savedExample = await example.save();
    res.status(201).json(savedExample);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

